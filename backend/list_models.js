require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error("No API key");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // There isn't a direct listModels in the simple SDK, but we can try to guess or use the REST API
        // But usually, we can just try gemini-1.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        console.log("gemini-1.5-flash works!");
    } catch (e) {
        console.log("gemini-1.5-flash failed:", e.message);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("test");
            console.log("gemini-pro works!");
        } catch (e2) {
            console.log("gemini-pro failed:", e2.message);
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
                const result = await model.generateContent("test");
                console.log("gemini-1.0-pro works!");
            } catch (e3) {
                console.log("gemini-1.0-pro failed:", e3.message);
            }
        }
    }
}
listModels();
