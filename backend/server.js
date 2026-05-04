require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const Groq = require("groq-sdk");
const multer = require("multer");

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Security middleware ─────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

// ─── Groq client ─────────────────────────────────────────────────────────────
let groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// ── Nodemailer ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "myprojectz.a1@gmail.com",
    pass: process.env.EMAIL_PASS
  }
});

const savedDiagrams = new Map();

// ═══════════════════════════════════════════════════════════════════════════════
// AI HELPER UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function extractJSON(text) {
  if (!text) return null;
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch?.[1]) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch (_) { }
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch (_) { }
  }
  return null;
}

const SHAPE_MAP = {
  // ER Diagram Mapping
  "entity": "rectangle",
  "weak_entity": "rectangle_double",
  "relationship": "diamond",
  "attribute": "ellipse",
  "key_attribute": "ellipse_underline",
  "foreign_key_attribute": "ellipse",
  "multi_valued_attr": "ellipse_double",

  // DFD Mapping
  "process": "rectangle_rounded",
  "external_entity": "rectangle",
  "datastore": "datastore",

  // Flowchart Mapping
  "start": "rectangle_rounded",
  "end": "rectangle_rounded",
  "activity": "rectangle",
  "decision": "diamond",

  // UML / Others
  "class": "rectangle_3section",
  "interface": "rectangle_2section_stereotype",
  "package": "package",
  "cloud": "cloud",
  "database": "cylinder",
  "actor": "stick_figure"
};

function normalizeNodes(nodes) {
  if (!nodes || !Array.isArray(nodes)) return [];
  return nodes.map((n, i) => {
    const id = (n.id || `node_${i}`).toLowerCase().replace(/\s+/g, '_');
    const rawShape = n.shapeType || n.shape || n.type || "rectangle";
    const mappedShape = SHAPE_MAP[rawShape] || rawShape;
    const label = n.label || n.text || (n.data && n.data.label) || "Untitled";

    return {
      id,
      type: "flowchart",
      position: {
        x: Number(n.position?.x || (100 + i * 200)),
        y: Number(n.position?.y || (100 + Math.floor(i / 3) * 150))
      },
      data: {
        label: label,
        shapeType: mappedShape,
        width: 140,
        height: 80,
        fillColor: "#ffffff"
      },
      style: { width: 140, height: 80 }
    };
  });
}

function normalizeEdges(edges, nodes) {
  if (!edges || !Array.isArray(edges)) return [];

  const nodeLookup = nodes.reduce((acc, n) => {
    acc[n.id] = n;
    return acc;
  }, {});

  return edges.map((e, i) => {
    const sId = String(e.source || "").toLowerCase().replace(/\s+/g, '_');
    const tId = String(e.target || "").toLowerCase().replace(/\s+/g, '_');

    const sNode = nodeLookup[sId];
    const tNode = nodeLookup[tId];

    if (!sNode || !tNode) return null;

    // Smart Routing Logic (Spatial Awareness)
    const dx = tNode.position.x - sNode.position.x;
    const dy = tNode.position.y - sNode.position.y;

    let sourceHandle = "port-2"; // Bottom default
    let targetHandle = "port-0-t"; // Top default

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) { sourceHandle = "port-1"; targetHandle = "port-3-t"; } // Right -> Left
      else { sourceHandle = "port-3"; targetHandle = "port-1-t"; } // Left -> Right
    } else {
      if (dy > 0) { sourceHandle = "port-2"; targetHandle = "port-0-t"; } // Bottom -> Top
      else { sourceHandle = "port-0"; targetHandle = "port-2-t"; } // Top -> Bottom
    }
    return {
      id: e.id || `edge_${i}`,
      source: sId,
      target: tId,
      sourceHandle,
      targetHandle,
      label: e.label || "",
      type: "smoothstep",
      animated: true,
      style: { stroke: "#555555", strokeWidth: 2 },
      markerEnd: { type: "arrowclosed", color: "#555555" },
      data: { label: e.label || "", stroke: "#555555", strokeWidth: 2 }
    };
  })
    .filter(Boolean);
}

function validateDiagram(diagram) {
  if (!diagram || typeof diagram !== 'object') return null;
  const nodes = normalizeNodes(diagram.nodes);
  const edges = normalizeEdges(diagram.edges, nodes);
  console.log(`🚀 FINAL DIAGRAM: ${nodes.length} nodes, ${edges.length} edges`);
  return {
    diagramType: diagram.diagramType || 'Flowchart',
    nodes,
    edges
  };
}

function buildDiagramSystemPrompt() {
  return `You are an expert systems architect. 

TASK:
1. Identify the diagram type.
2. Generate nodes and edges. EVERY node MUST have at least one connection.
3. For DFD: 'process' (circle), 'datastore' (data_store), 'external_entity' (rectangle).
4. For ER: 'entity', 'relationship', 'attribute'. Every attribute MUST connect to an entity.

RULES:
- node id: must be lowercase snake_case (e.g., "member_ent", "process_req").
- edges: MUST connect source and target using these exact IDs.
- output: ONLY valid JSON. No text before or after.

JSON SCHEMA:
{
  "diagramType": "DFD|ER|Flowchart|UML",
  "nodes": [{"id": "...", "label": "...", "shapeType": "process|datastore|entity|etc", "position": {"x":0,"y":0}}],
  "edges": [{"id": "...", "source": "...", "target": "...", "label": "..."}]
}`;
}

function buildImageParsePrompt(userContext, diagramType = "auto") {
  return `Analyze this ${diagramType} diagram image and return React Flow JSON. 
  IMPORTANT: Replicate the layout, positions, and labels EXACTLY as they appear in the image.
  ${userContext ? `User instructions: "${userContext}"` : ""}
  Return ONLY JSON.`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({
    message: "Smart Diagram Generator API v3.6.2 🚀",
    aiStatus: groq ? "Groq Connected ✅" : "Demo Mode ⚠️",
    status: "Running"
  });
});

// AI Text → Diagram
app.post("/api/ai/generate", async (req, res) => {
  let { prompt, type } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: "prompt is required" });

  // Intelligent type detection
  let detectedType = type || "auto";
  const pLower = prompt.toLowerCase();
  if (pLower.includes("dfd") || pLower.includes("data flow")) detectedType = "DFD";
  else if (pLower.includes("er ") || pLower.includes("er-") || pLower.includes("entity")) detectedType = "ER";
  else if (pLower.includes("flowchart") || pLower.includes("process flow")) detectedType = "Flowchart";
  else if (pLower.includes("class") || pLower.includes("uml")) detectedType = "UML";

  if (!groq) {
    return res.json({
      success: true, isSimulation: true,
      message: "Groq key missing — showing demo diagram",
      diagram: {
        diagramType: "Flowchart",
        nodes: [
          { id: "n1", label: "Start", shapeType: "start", position: { x: 100, y: 100 } },
          { id: "n2", label: "Action", shapeType: "activity", position: { x: 300, y: 100 } },
          { id: "n3", label: "End", shapeType: "end", position: { x: 500, y: 100 } }
        ],
        edges: [{ id: "e1", source: "n1", target: "n2" }, { id: "e2", source: "n2", target: "n3" }]
      }
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: buildDiagramSystemPrompt() },
        { role: "user", content: `Type: ${detectedType}. Request: ${prompt}` },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const rawText = completion.choices[0]?.message?.content;
    console.log("RAW AI RESPONSE:", rawText);
    const diagramRaw = extractJSON(rawText);
    if (!diagramRaw) throw new Error("AI returned invalid JSON");

    const diagram = validateDiagram(diagramRaw);

    res.json({ success: true, diagram });
  } catch (err) {
    console.error("AI GENERATION ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

// ─── Gemini Client ───────────────────────────────────────────────────────────
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// AI Image → Diagram (NOW WITH RESILIENCE FALLBACK)
app.post("/api/ai/parse-image", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  const base64Image = req.file.buffer.toString("base64");
  const prompt = buildImageParsePrompt(req.body.context, req.body.diagramType);

  // --- Tier 1: Try Google Gemini 2.0 Flash (Primary) ---
  if (genAI) {
    try {
      console.log("🚀 Layer 1: Attempting Gemini 2.0 Flash...");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
      ]);
      const response = await result.response;
      const rawText = response.text();
      const diagramRaw = extractJSON(rawText);
      if (diagramRaw) return res.json({ success: true, diagram: validateDiagram(diagramRaw), provider: "Gemini 2.0" });
    } catch (err) {
      console.warn("⚠️ Layer 1 Quota Exceeded. Trying Layer 2...");
    }

    // --- Tier 2: Try Google Gemini 1.5 Flash (Higher Quota) ---
    try {
      console.log("🚀 Layer 2: Attempting Gemini 1.5 Flash (High Quota)...");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
      ]);
      const response = await result.response;
      const rawText = response.text();
      const diagramRaw = extractJSON(rawText);
      if (diagramRaw) return res.json({ success: true, diagram: validateDiagram(diagramRaw), provider: "Gemini 1.5" });
    } catch (err) {
      console.warn("⚠️ Layer 2 Quota Exceeded. Trying Layer 3 (Groq)...");
    }
  }

  // --- Tier 3: Fallback to Groq (Llama 4 Scout) ---
  if (groq) {
    try {
      console.log("⚡ Layer 3: Attempting Groq Llama 4 Scout...");
      const completion = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${req.file.mimetype};base64,${base64Image}` } }
            ]
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const rawText = completion.choices[0]?.message?.content;
      const diagramRaw = extractJSON(rawText);
      if (diagramRaw) return res.json({ success: true, diagram: validateDiagram(diagramRaw), provider: "Groq Llama 4" });
    } catch (err) {
      console.error("❌ All AI Layers failed:", err.message);
    }
  }

  res.status(503).json({ success: false, error: "All AI vision models are currently over quota. Please wait a minute and try again." });
});

// Feedback API
app.post("/api/feedback", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });
  if (!process.env.EMAIL_PASS) return res.status(500).json({ error: "Email service not configured" });

  const mailOptions = {
    from: process.env.EMAIL_USER || "myprojectz.a1@gmail.com",
    to: "myprojectz.a1@gmail.com",
    subject: "New Smart Diagram Feedback",
    text: message
  };
  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Feedback sent" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send feedback" });
  }
});

// Diagram persistence
app.post("/api/diagrams/save", (req, res) => {
  const { id, diagram, name } = req.body;
  const diagramId = id || `diagram_${Date.now()}`;
  savedDiagrams.set(diagramId, { id: diagramId, name: name || diagramId, diagram, savedAt: new Date() });
  res.json({ success: true, id: diagramId });
});

app.get("/api/diagrams/:id", (req, res) => {
  const d = savedDiagrams.get(req.params.id);
  if (!d) return res.status(404).json({ error: "Not found" });
  res.json(d);
});

app.get("/api/diagrams", (req, res) => res.json(Array.from(savedDiagrams.values())));

const PORT = process.env.PORT || 5005; 

// ── Serve Frontend Production Build ──────────────────────────────────────────
const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend/build")));

// All other GET requests not handled will return the React app
app.get("/:any*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"), (err) => {
    if (err) {
      // Fallback if build doesn't exist yet
      res.status(404).send("Smart Diagram Studio: Production build not found. Please run 'npm run build' in the frontend folder.");
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Smart Diagram Backend v3.6.8 Grid Master on http://127.0.0.1:${PORT}`);
  console.log(`⏰ Server Timestamp: ${new Date().toLocaleTimeString()}`);
});