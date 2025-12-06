// Test Google Gemini AI Integration
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

async function testBasic() {
  console.log("🧪 Testing Google Gemini AI...\n");
  console.log(
    "API Key (first 20 chars):",
    process.env.GOOGLE_API_KEY?.substring(0, 20) + "..."
  );

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Explain how AI works in a few words",
    });

    console.log("\n✅ SUCCESS! Gemini is working!");
    console.log("📝 Response:", response.text);
    console.log("\n✨ Your API key is configured correctly!");
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check if GOOGLE_API_KEY is set in .env file");
    console.log("2. Get a NEW key at https://aistudio.google.com/apikey");
    console.log("3. Make sure you copy the ENTIRE key (starts with AIzaSy)");
    console.log("4. Restart the server after updating .env");
    console.log("\nFull error:", error);
  }
}

async function testRFPConversion() {
  console.log("\n🧪 Testing RFP Conversion...\n");

  const testInput =
    "I need 10 laptops with i5 processor and 8GB RAM. Budget is around 50000. Need delivery in 15 days.";

  try {
    const prompt = `Convert this text into a structured RFP JSON:

INPUT: "${testInput}"

OUTPUT FORMAT:
{
  "id": "RFP-20231206-abc",
  "title": "Brief title",
  "budget": number,
  "deliveryTimeline": "timeline",
  "items": [{"name": "item", "qty": number, "spec": "specs"}],
  "paymentTerms": "terms",
  "warranty": "warranty"
}

Return ONLY valid JSON, no markdown.`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let jsonText = response.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const rfp = JSON.parse(jsonText);

    console.log("✅ SUCCESS! RFP Conversion is working!");
    console.log("📋 Generated RFP:");
    console.log(JSON.stringify(rfp, null, 2));
    console.log("\n🎉 Your system is ready to generate RFPs!");
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.log("\n🔧 This might be a temporary issue. Try again in a moment.");
  }
}

// Run tests
async function main() {
  await testBasic();
  await testRFPConversion();
}

main();
