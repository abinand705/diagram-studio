const fs = require('fs');

// Mock currentExtent
const currentExtent = { x: 100 };

// Import the function from server.js loosely
// (Since we can't easily require it without exporting, we'll extract it)
const serverContent = fs.readFileSync(__dirname + '/server.js', 'utf8');
const promptMatch = serverContent.match(/function buildDiagramSystemPrompt[\s\S]*?return `([\s\S]*?)`;\n}/);

if (!promptMatch) {
    console.error("❌ Failed to extract buildDiagramSystemPrompt from server.js");
    process.exit(1);
}

const rawPrompt = promptMatch[1].replace('${offsetX}', (currentExtent.x + 300).toString());

console.log("--- PROMPT VALIDATION ---");
const hasShapeType = rawPrompt.includes('shapeType');
const hasFlowchartType = rawPrompt.includes('"type": "flowchart"');
const hasClockFace = rawPrompt.includes('CLOCK-FACE RULES');

if (hasShapeType && hasFlowchartType && hasClockFace) {
    console.log("✅ Prompt includes shapeType requirement");
    console.log("✅ Prompt enforces type: flowchart");
    console.log("✅ Prompt includes Clock-Face positioning rules");
} else {
    if (!hasShapeType) console.error("❌ Prompt MISSING shapeType requirement");
    if (!hasFlowchartType) console.error("❌ Prompt MISSING type: flowchart enforcement");
    if (!hasClockFace) console.error("❌ Prompt MISSING Clock-Face rules");
    process.exit(1);
}

console.log("\n--- JSON STRUCTURE VALIDATION ---");
// Extract the example JSON from the prompt and parse it
const exampleSection = rawPrompt.split('=== ER EXAMPLE')[1];
const jsonMatch = exampleSection.match(/\{[\s\S]*?\n\s*\}/);

if (!jsonMatch) {
    console.error("❌ Failed to find JSON block in ER EXAMPLE section");
    process.exit(1);
}

const exampleJsonText = jsonMatch[0];
try {
    const diagram = JSON.parse(exampleJsonText);
    if (diagram.nodes && diagram.nodes.length > 0) {
        const node = diagram.nodes[0];
        if (node.type === 'flowchart' && node.data && node.data.shapeType) {
            console.log("✅ Example JSON is valid and uses shapeType");
        } else {
            console.error("❌ Example JSON node is malformed", JSON.stringify(node));
            process.exit(1);
        }
    } else {
        console.error("❌ Example JSON has no nodes");
        process.exit(1);
    }
} catch (e) {
    console.error("❌ Failed to parse example JSON from prompt", e.message);
    console.log("Faulty JSON text:", exampleJsonText);
    process.exit(1);
}

console.log("\n🚀 ALL AUTOMATED CHECKS PASSED PERFECTLY!");
