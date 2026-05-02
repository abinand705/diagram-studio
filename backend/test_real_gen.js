require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

async function testRealGen() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error("❌ No GOOGLE_GENERATIVE_AI_API_KEY in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Extract the prompt function
    const serverContent = fs.readFileSync(__dirname + '/server.js', 'utf8');
    const promptMatch = serverContent.match(/function buildDiagramSystemPrompt[\s\S]*?return `([\s\S]*?)`;\n}/);
    const rawPrompt = promptMatch[1];

    const userPrompt = "Generate a compact ER diagram for a Library system: Book (ISBN, Title), Author (Id, Name). Author writes Book.";
    
    console.log("🚀 Sending request to Gemini...");
    try {
        const result = await model.generateContent([
            { text: rawPrompt },
            { text: userPrompt }
        ]);
        const responseText = result.response.text();
        console.log("✅ Received Response:");
        console.log("----------------------");
        console.log(responseText);
        console.log("----------------------");
        
        // Try parsing
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const diagram = JSON.parse(jsonMatch[0]);
            console.log("🎉 Successfully parsed JSON!");
            console.log(`Nodes: ${diagram.nodes.length}, Edges: ${diagram.edges.length}`);
        } else {
            console.error("❌ No JSON found in response");
        }
    } catch (e) {
        console.error("❌ Gemini API Error:", e.message);
    }
}

testRealGen();
