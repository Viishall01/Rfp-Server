import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Google Gemini AI
const apiKey = process.env.GOOGLE_API_KEY || "";
console.log(
  "🔑 Google API Key loaded:",
  apiKey ? `${apiKey.substring(0, 20)}...` : "NOT FOUND"
);

const genAI = new GoogleGenAI({
  apiKey: apiKey,
});

interface RFPItem {
  name: string;
  qty: number;
  spec: string;
}

interface RFPStructure {
  id: string;
  title: string;
  budget: number;
  deliveryTimeline: string;
  items: RFPItem[];
  paymentTerms: string;
  warranty: string;
}

export const convertTextToRFP = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: text",
      });
    }

    // Create a detailed prompt for OpenAI
    const prompt = `You are an expert in converting casual procurement requests into structured RFP (Request for Proposal) documents.

Convert the following text into a structured JSON format:

INPUT TEXT: "${text}"

OUTPUT FORMAT (strictly follow this JSON structure):
{
  "id": "unique-id-based-on-content",
  "title": "Brief title for the procurement",
  "budget": budget_amount_as_number,
  "deliveryTimeline": "timeline in readable format",
  "items": [
    {
      "name": "Item name",
      "qty": quantity_as_number,
      "spec": "specifications"
    }
  ],
  "paymentTerms": "payment terms (default: Net 30 if not specified)",
  "warranty": "warranty period (default: 1 year if not specified)"
}

RULES:
1. Extract all numerical values accurately
2. If budget is mentioned with 'k' or 'K', multiply by 1000
3. If budget is mentioned with 'lakh' or 'lac', multiply by 100000
4. If quantity is not specified, assume 1
5. If delivery timeline is not specified, use "As soon as possible"
6. Group similar items together
7. Extract all specifications mentioned
8. Generate a unique ID using format: RFP-{YYYYMMDD}-{random}
9. Only return valid JSON, no extra text or markdown

Return ONLY the JSON object, nothing else.`;

    // Call Google Gemini AI
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert at converting text into structured RFP JSON format. Always return valid JSON only.\n\n${prompt}`,
    });

    const generatedText = response.text || "";

    // Clean the response (remove markdown code blocks if present)
    let cleanedText = generatedText;
    cleanedText = cleanedText.replace(/```json\n?/g, "");
    cleanedText = cleanedText.replace(/```\n?/g, "");
    cleanedText = cleanedText.trim();

    // Parse the JSON response
    const rfpData: RFPStructure = JSON.parse(cleanedText);

    // Validate the structure
    if (
      !rfpData.id ||
      !rfpData.title ||
      !rfpData.items ||
      rfpData.items.length === 0
    ) {
      throw new Error("Invalid RFP structure generated");
    }

    return res.status(200).json({
      success: true,
      message: "Text successfully converted to RFP",
      data: rfpData,
    });
  } catch (err: any) {
    console.error("Convert to RFP error:", err);

    // Check if it's a JSON parse error
    if (err instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        error: "Failed to parse AI response",
        details: "The AI generated invalid JSON format",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to convert text to RFP",
      details: err.message || String(err),
    });
  }
};
