import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

async function listModels() {
  console.log("📋 Listing available models...\n");

  try {
    const models = await genAI.models.list();
    console.log("Available models:");
    console.log(JSON.stringify(models, null, 2));
  } catch (error) {
    console.error("Error:", error.message);

    // Try a simple generation without specifying model
    console.log("\nTrying default model...");
    try {
      const response = await genAI.models.generateContent({
        contents: "Say hello",
      });
      console.log("✅ Default model works!");
      console.log("Response:", response.text);
    } catch (e) {
      console.error("Default model also failed:", e.message);
    }
  }
}

listModels();
