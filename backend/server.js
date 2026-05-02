#!/usr/bin/env node
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Groq = require("groq-sdk");
const nodemailer = require("nodemailer");

// Setup
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

let groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: true, // Reflect the request origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "myprojectz.a1@gmail.com",
    pass: process.env.EMAIL_PASS
  }
});

app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 150 }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

const savedDiagrams = new Map();

// ── Feedback API ─────────────────────────────────────────────────────────────
app.post("/api/feedback", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!process.env.EMAIL_PASS) {
    console.error("EMAIL_PASS not configured in backend/.env");
    return res.status(500).json({ error: "Email service not configured on the server." });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER || "myprojectz.a1@gmail.com",
    to: "myprojectz.a1@gmail.com",
    subject: "New Smart Diagram Feedback",
    text: message,
    html: `<div style="font-family: sans-serif; padding: 20px;">
             <h2>New User Feedback</h2>
             <p style="white-space: pre-wrap;">${message}</p>
           </div>`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Feedback sent successfully" });
  } catch (error) {
    console.error("Error sending feedback email:", error);
    res.status(500).json({ error: "Failed to send feedback" });
  }
});

// ── Helper: Robust JSON extraction ───────────────────────────────────────────
function extractJSON(text) {
  if (!text) return null;

  // Strip markdown fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch?.[1]) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch (_) { }
  }

  // Find outermost { ... }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch (_) { }
  }

  return null;
}

// ── Helper: Normalize nodes — ensure shapeType key is always set ──────────────
function normalizeNodes(nodes) {
  // ER shape type mapping: ensure attributes are ovals and relationships are diamonds
  const ER_SHAPE_MAP = {
    'attribute': 'ellipse',
    'key_attribute': 'ellipse',
    'foreign_key_attribute': 'ellipse',
    'multi_valued_attr': 'ellipse',
    'entity': 'rectangle',
    'weak_entity': 'rectangle_double',
    'relationship': 'diamond',
  };

  return (nodes || []).map(n => {
    let shapeType = n.data?.shapeType || "rectangle";
    const originalShape = shapeType;

    // Map ER-specific shape names to renderable shape types
    if (ER_SHAPE_MAP[shapeType]) {
      shapeType = ER_SHAPE_MAP[shapeType];
    }

    // Build data with key underline flags preserved
    const data = {
      ...n.data,
      shapeType,
      fillColor: n.data?.fillColor || "#ffffff",
    };

    // Auto-detect primary key: if original was 'key_attribute', set underline
    if (originalShape === 'key_attribute') {
      data.underline = true;
    }
    // Auto-detect foreign key: if original was 'foreign_key_attribute', set dotted underline
    if (originalShape === 'foreign_key_attribute') {
      data.dottedUnderline = true;
    }

    return { ...n, type: "flowchart", data };
  });
}

// ── Helper: Normalize edges — use React Flow built-in "smoothstep" type ──────
function normalizeEdges(edges) {
  return (edges || []).map(e => ({
    ...e,
    type: "smoothstep",
    style: { stroke: "#555", strokeWidth: 2, ...(e.style || {}) },
    markerEnd: e.data?.markerEnd === "arrow" || e.data?.markerEnd === "none"
      ? (e.data.markerEnd === "arrow"
        ? { type: "arrow", color: "#555" }
        : undefined)
      : undefined,
    data: { ...(e.data || {}) }
  }));
}

// ── Helper: Validate diagram ──────────────────────────────────────────────────
function validateDiagram(diagram) {
  const errors = [];
  if (!diagram || !Array.isArray(diagram.nodes)) return { valid: false, errors: ["Missing nodes array"] };
  const nodeIds = new Set(diagram.nodes.map(n => n.id).filter(Boolean));
  (diagram.edges || []).forEach((e, i) => {
    if (!nodeIds.has(e.source)) errors.push(`Edge ${i}: source "${e.source}" not found`);
    if (!nodeIds.has(e.target)) errors.push(`Edge ${i}: target "${e.target}" not found`);
  });
  return { valid: errors.length === 0, errors };
}

// ── System Prompt: Text → Diagram ─────────────────────────────────────────────
function buildDiagramSystemPrompt(currentExtent) {
  return `
=== ROLE ===
You are an expert diagram specialist supporting ALL 13 diagram types below.
Return ONLY valid JSON with "nodes" and "edges" arrays. No markdown fences.

=== MASTER SHAPE REFERENCE (shapeType → visual) ===
IMPORTANT: "type" for every node is ALWAYS "flowchart". The visual is controlled by "shapeType" in data.

--- ER Diagram ---
entity              → Rectangle           fillColor: "#eff6ff"
attribute           → Oval/Ellipse        fillColor: "#ffffff"  (NEVER "rectangle")
key_attribute       → Oval + underline    fillColor: "#ffffff"  (PK: "underline":true)
foreign_key_attribute → Oval + dotted     fillColor: "#ffffff"  (FK: "dottedUnderline":true)
multi_valued_attr   → Double Oval         fillColor: "#ffffff"
relationship        → Diamond             fillColor: "#ffffff"
weak_entity         → Double Rectangle    fillColor: "#eff6ff"

--- Class / Object / Package Diagram ---
rectangle_3section  → 3-Section Box       (ClassName | attributes | methods)
rectangle_2section_stereotype → 2-Section (<<interface>> | methods)
rectangle_3section_italic → Italic header (Abstract class)
package             → Package tab box
note                → Folded-corner note

--- Use Case Diagram ---
stick_figure        → Actor (stick person)
ellipse             → Use Case oval
rectangle_label_top → System Boundary

--- Activity Diagram ---
circle_filled       → Initial Node (●)
circle_bullseye     → Final Node (◉)
rectangle_rounded   → Action / State
diamond             → Decision
bar_horizontal      → Fork / Join bar

--- Sequence Diagram ---
lifeline            → Lifeline (box + dashed line)
activation          → Activation bar
fragment            → Fragment frame (alt/loop)

--- State Machine ---
rectangle_rounded   → State
circle_filled       → Initial state
circle_bullseye     → Final state
circle_H            → History state

--- Component & Deployment ---
component           → UML Component
cube_3d             → Deployment Node
cylinder            → Database
cloud               → Cloud

--- DFD (Data Flow Diagram) ---
circle              → Process
data_store          → Data Store (open rectangle)
rectangle           → External Entity

--- Flowchart ---
rectangle           → Process step
rectangle_rounded   → Terminal (Start/End)
diamond             → Decision
ellipse             → Connector

--- Context Diagram ---
(Same shapes as DFD: circle, rectangle, data_store)

--- Communication Diagram ---
(Uses stick_figure for actors, rectangle for objects, labeled edges)

=== ER CLOCK-FACE LAYOUT ===
Place attributes around their entity at ~160px distance in clock positions:
12→(E.x, E.y-160) 3→(E.x+200, E.y) 6→(E.x, E.y+160) 9→(E.x-200, E.y)

=== ER EXAMPLE ===
User: "Student(Id PK, Name). Course(Code PK). Student enrolls Course."
{
  "nodes": [
    {"id":"student","type":"flowchart","position":{"x":300,"y":300},"data":{"label":"Student","shapeType":"entity","fillColor":"#eff6ff"}},
    {"id":"sid","type":"flowchart","position":{"x":300,"y":140},"data":{"label":"Id","shapeType":"key_attribute","underline":true,"fillColor":"#ffffff"}},
    {"id":"sname","type":"flowchart","position":{"x":500,"y":300},"data":{"label":"Name","shapeType":"attribute","fillColor":"#ffffff"}},
    {"id":"enrolls","type":"flowchart","position":{"x":600,"y":200},"data":{"label":"Enrolls","shapeType":"relationship","fillColor":"#ffffff"}},
    {"id":"course","type":"flowchart","position":{"x":900,"y":300},"data":{"label":"Course","shapeType":"entity","fillColor":"#eff6ff"}},
    {"id":"ccode","type":"flowchart","position":{"x":900,"y":140},"data":{"label":"Code","shapeType":"key_attribute","underline":true,"fillColor":"#ffffff"}}
  ],
  "edges": [
    {"id":"e1","source":"student","target":"sid","type":"drawio","data":{"markerEnd":"none"}},
    {"id":"e2","source":"student","target":"sname","type":"drawio","data":{"markerEnd":"none"}},
    {"id":"e3","source":"student","target":"enrolls","type":"drawio","data":{"markerEnd":"none"}},
    {"id":"e4","source":"enrolls","target":"course","type":"drawio","data":{"markerEnd":"none"}},
    {"id":"e5","source":"course","target":"ccode","type":"drawio","data":{"markerEnd":"none"}}
  ]
}

=== CLASS DIAGRAM EXAMPLE ===
User: "Class User with name, email, login(). Class Order with id, date."
{
  "nodes": [
    {"id":"user","type":"flowchart","position":{"x":100,"y":100},"data":{"label":"User\\n─────\\n+name: String\\n+email: String\\n─────\\n+login(): bool","shapeType":"rectangle_3section","fillColor":"#eff6ff"}},
    {"id":"order","type":"flowchart","position":{"x":400,"y":100},"data":{"label":"Order\\n─────\\n+id: int\\n+date: Date\\n─────\\n+calcTotal(): float","shapeType":"rectangle_3section","fillColor":"#eff6ff"}}
  ],
  "edges": [
    {"id":"e1","source":"user","target":"order","type":"drawio","data":{"label":"places","markerEnd":"arrow"}}
  ]
}

=== CRITICAL RULES ===
1. MANDATORY EDGES: Every ER attribute MUST connect to its entity. Every relationship MUST connect to both entities.
2. ER attributes: shapeType MUST be "attribute"/"key_attribute"/"foreign_key_attribute". NEVER "rectangle".
3. PK: "underline":true. FK: "dottedUnderline":true.
4. All edges: type "drawio". ER edges: data.markerEnd "none". Flowchart edges: data.markerEnd "arrow".
5. Auto-detect diagram type from the user prompt and use the correct shapes from the Master Reference above.
6. Return ONLY a JSON object with "nodes" and "edges" arrays.
`;
}

// ── System Prompt: Image → Diagram ────────────────────────────────────────────
function buildImageParsePrompt(userContext) {
  const contextLine = userContext ? `\nUser notes: "${userContext}"` : '';
  return `
=== MISSION ===
You are reading a diagram image. Your job is to:
1. IDENTIFY the diagram type (ER, Flowchart, Class, Use Case, DFD, etc.)
2. EXTRACT every shape, label, and connection line visible in the image
3. REPRODUCE the exact diagram as React Flow JSON with correct shapes and ALL connections
4. VALIDATE that every attribute connects to an entity, every relationship connects to entities
${contextLine}

Return ONLY raw JSON. No markdown fences.

=== SHAPE RECOGNITION ===
ER Diagrams:
- Rectangles → shapeType: "entity"  (entity boxes)
- Ovals/Ellipses → shapeType: "attribute"  (attributes — NEVER use "rectangle" for these)
- Ovals with underlined text → shapeType: "key_attribute", "underline": true  (primary key)
- Ovals with dotted underline → shapeType: "foreign_key_attribute", "dottedUnderline": true  (foreign key)
- Diamonds → shapeType: "relationship"
- Double-bordered rectangles → shapeType: "weak_entity"
- Double-bordered ovals → shapeType: "multi_valued_attr"

Flowcharts:
- Rounded rectangles → shapeType: "rectangle_rounded" (terminal/start/end)
- Rectangles → shapeType: "rectangle" (process)
- Diamonds → shapeType: "diamond" (decision)
- Parallelograms → shapeType: "data"

Class Diagrams:
- Multi-section rectangles → shapeType: "rectangle_3section"

Use Case:
- Stick figures → shapeType: "stick_figure" (actor)
- Ovals → shapeType: "ellipse" (use case)

DFD:
- Circles → shapeType: "circle" (process)
- Open rectangles → shapeType: "data_store"
- Rectangles → shapeType: "rectangle" (external entity)

Other: component, cube_3d, cylinder, cloud, lifeline, circle_filled, circle_bullseye, bar_horizontal

=== CRITICAL CONNECTION RULES ===
1. Every attribute oval MUST have an edge to its parent entity rectangle.
2. Every relationship diamond MUST have edges to BOTH connected entities.
3. Trace EVERY line visible in the image — even faint or short ones — and create an edge for it.
4. If a line connects shape A to shape B, create: {"source": "A_id", "target": "B_id"}
5. Do NOT skip any connections. Missing edges make the diagram incorrect.

=== REQUIRED JSON FORMAT ===
{
  "diagramType": "ER" | "Flowchart" | "Class" | "UseCase" | "DFD" | "Other",
  "nodes": [
    { "id": "unique_id", "type": "flowchart", "position": {"x": 100, "y": 100}, "data": {"label": "Name", "shapeType": "entity", "fillColor": "#eff6ff"} }
  ],
  "edges": [
    { "id": "edge_id", "source": "node1", "target": "node2", "type": "drawio", "data": {"markerEnd": "none"} }
  ]
}

IMPORTANT: 
- Use approximate pixel positions from the image. Preserve spatial layout.
- Scale positions so the diagram fits within x:0-1200, y:0-800.
- All edges MUST have type: "drawio".
- For ER diagrams, edges should have data.markerEnd: "none".
Return ONLY the JSON object.
`;
}

// ── Helper: Repair missing connections ────────────────────────────────────────
function repairDiagram(diagram) {
  const nodes = diagram.nodes || [];
  const edges = diagram.edges || [];
  const repairs = [];

  // Build lookup maps
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const connectedPairs = new Set(edges.map(e => `${e.source}→${e.target}`));
  const connectedPairsReverse = new Set(edges.map(e => `${e.target}→${e.source}`));
  const isConnected = (a, b) => connectedPairs.has(`${a}→${b}`) || connectedPairsReverse.has(`${a}→${b}`);

  // Get nodes by shape category
  const attrShapes = ['ellipse', 'attribute', 'key_attribute', 'foreign_key_attribute', 'multi_valued_attr'];
  const entityShapes = ['rectangle', 'entity', 'weak_entity', 'rectangle_double'];
  const relShapes = ['diamond', 'relationship'];

  const entities = nodes.filter(n => entityShapes.includes(n.data?.shapeType));
  const attributes = nodes.filter(n => attrShapes.includes(n.data?.shapeType));
  const relationships = nodes.filter(n => relShapes.includes(n.data?.shapeType));

  // For each attribute, ensure it's connected to the nearest entity
  attributes.forEach(attr => {
    const hasConnection = edges.some(e => e.source === attr.id || e.target === attr.id);
    if (!hasConnection && entities.length > 0) {
      // Find nearest entity by position
      let nearest = entities[0];
      let minDist = Infinity;
      entities.forEach(ent => {
        const dx = (attr.position?.x || 0) - (ent.position?.x || 0);
        const dy = (attr.position?.y || 0) - (ent.position?.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) { minDist = dist; nearest = ent; }
      });
      const edgeId = `repair_${attr.id}_${nearest.id}`;
      edges.push({ id: edgeId, source: nearest.id, target: attr.id, type: 'smoothstep', style: { stroke: "#555", strokeWidth: 2 }, data: { markerEnd: 'none' } });
      repairs.push(`Connected attribute "${attr.data?.label}" to entity "${nearest.data?.label}"`);
    }
  });

  // For each relationship, ensure it connects to at least 2 entities
  relationships.forEach(rel => {
    const relEdges = edges.filter(e => e.source === rel.id || e.target === rel.id);
    const connectedEntities = relEdges.map(e => {
      const otherId = e.source === rel.id ? e.target : e.source;
      return nodeMap.get(otherId);
    }).filter(n => n && entityShapes.includes(n.data?.shapeType));

    if (connectedEntities.length < 2 && entities.length >= 2) {
      // Find nearest unconnected entities
      const connectedIds = new Set(connectedEntities.map(e => e.id));
      const unconnected = entities.filter(e => !connectedIds.has(e.id))
        .map(ent => ({
          ent,
          dist: Math.sqrt(
            Math.pow((rel.position?.x || 0) - (ent.position?.x || 0), 2) +
            Math.pow((rel.position?.y || 0) - (ent.position?.y || 0), 2)
          )
        }))
        .sort((a, b) => a.dist - b.dist);

      const needed = 2 - connectedEntities.length;
      for (let i = 0; i < Math.min(needed, unconnected.length); i++) {
        const ent = unconnected[i].ent;
        const edgeId = `repair_${rel.id}_${ent.id}`;
        edges.push({ id: edgeId, source: rel.id, target: ent.id, type: 'smoothstep', style: { stroke: "#555", strokeWidth: 2 }, data: { markerEnd: 'none' } });
        repairs.push(`Connected relationship "${rel.data?.label}" to entity "${ent.data?.label}"`);
      }
    }
  });

  return { nodes, edges, repairs };
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({
    message: "Smart Diagram Generator API v3.0 🚀",
    aiStatus: groq ? "Connected (Groq)" : "Demo Mode",
    models: ["llama-3.3-70b-versatile", "meta-llama/llama-4-scout-17b-16e-instruct"]
  });
});

// Update API keys at runtime
app.post("/api/ai/config", (req, res) => {
  const { groqApiKey } = req.body;
  try {
    if (groqApiKey) groq = new Groq({ apiKey: groqApiKey });
    res.json({ success: true, message: "Groq API key updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Text → Diagram (primary route)
app.post("/api/ai/generate", async (req, res) => {
  const { prompt, type, currentExtent } = req.body;
  console.log(`\n🤖 Generate request [${type}]: "${String(prompt).substring(0, 60)}..."`);

  if (!groq) {
    console.warn("⚠️  No Groq API key — returning simulation diagram.");
    const ox = (typeof currentExtent?.x === 'number') ? currentExtent.x + 100 : 100;
    return res.json({
      success: true, isSimulation: true,
      message: "No Groq API key configured.",
      diagram: {
        nodes: [
          { id: "sim_1", type: "flowchart", position: { x: ox, y: 0 }, data: { label: "Start", shapeType: "terminal", fillColor: "#fef9c3" } },
          { id: "sim_2", type: "flowchart", position: { x: ox, y: 130 }, data: { label: "Process (Simulation)", shapeType: "process", fillColor: "#f1f5f9" } },
          { id: "sim_3", type: "flowchart", position: { x: ox, y: 260 }, data: { label: "End", shapeType: "terminal", fillColor: "#fef9c3" } }
        ],
        edges: [
          { id: "sim_e1", source: "sim_1", target: "sim_2", type: "smoothstep", style: { stroke: "#555", strokeWidth: 2 }, markerEnd: { type: "arrow", color: "#555" } },
          { id: "sim_e2", source: "sim_2", target: "sim_3", type: "smoothstep", style: { stroke: "#555", strokeWidth: 2 }, markerEnd: { type: "arrow", color: "#555" } }
        ]
      }
    });
  }

  const systemPrompt = buildDiagramSystemPrompt(currentExtent);
  const userMessage = `Diagram Type: ${type || "auto-detect"}\nUser Request: ${prompt}\n\nGenerate the diagram JSON now.`;

  try {
    console.log(`📡 Using Groq: llama-3.3-70b-versatile`);
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const rawText = completion.choices[0]?.message?.content;
    const diagram = extractJSON(rawText);
    if (diagram && Array.isArray(diagram.nodes)) {
      diagram.nodes = normalizeNodes(diagram.nodes);
      diagram.edges = normalizeEdges(diagram.edges);
      console.log(`✅ Success with Groq: ${diagram.nodes.length} nodes`);
      return res.json({ success: true, diagram, model: "llama-3.3-70b-versatile", provider: "groq" });
    }
  } catch (err) {
    console.error(`❌ Groq generation failed: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Image → Diagram (with validation & repair)
app.post("/api/ai/parse-image", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image file provided" });
  if (!groq) return res.status(500).json({ error: "Groq not configured" });

  const userContext = req.body?.context || "";

  try {
    console.log(`📡 Using Groq Vision: meta-llama/llama-4-scout-17b-16e-instruct`);
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildImageParsePrompt(userContext) },
            { type: "image_url", image_url: { url: `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}` } }
          ]
        }
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const rawText = completion.choices[0]?.message?.content;
    const diagram = extractJSON(rawText);
    if (diagram && Array.isArray(diagram.nodes)) {
      // Step 1: Normalize shapes (attribute→ellipse, relationship→diamond, etc.)
      diagram.nodes = normalizeNodes(diagram.nodes);
      diagram.edges = normalizeEdges(diagram.edges);

      // Step 2: Validate — check for broken edges
      const validation = validateDiagram(diagram);

      // Step 3: Repair missing connections (attribute↔entity, relationship↔entities)
      const { nodes, edges, repairs } = repairDiagram(diagram);

      const nodeCount = nodes.length;
      const edgeCount = edges.length;
      const diagramType = diagram.diagramType || "Unknown";

      console.log(`✅ Image parsed: ${nodeCount} nodes, ${edgeCount} edges (${diagramType})`);
      if (repairs.length > 0) console.log(`🔧 Auto-repaired ${repairs.length} missing connections`);
      if (!validation.valid) console.log(`⚠️  Validation issues: ${validation.errors.join(', ')}`);

      return res.json({
        success: true,
        diagram: { nodes, edges },
        diagramType,
        validation: {
          valid: validation.valid && repairs.length === 0,
          repairs,
          warnings: validation.errors
        },
        stats: { nodes: nodeCount, edges: edgeCount },
        provider: "groq",
        model: "meta-llama/llama-4-scout-17b-16e-instruct"
      });
    }
  } catch (err) {
    console.error(`❌ Groq Vision failed: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }

  return res.status(500).json({ success: false, error: "Image parsing failed" });
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
  if (!d) return res.status(404).json({ error: "Diagram not found" });
  res.json(d);
});

app.get("/api/diagrams", (req, res) => res.json(Array.from(savedDiagrams.values())));

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   Smart Diagram Generator — Backend v3.0        ║
║   🚀 Running at http://localhost:${PORT}          ║
║   ${groq ? "✅ Groq Connected (Llama 3.3)" : "⚠️  Demo Mode — Add GROQ_API_KEY to .env"}     ║
╚══════════════════════════════════════════════════╝
  `);
});