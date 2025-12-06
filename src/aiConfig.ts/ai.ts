// @ts-nocheck
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = process.env.GOOGLE_GEMINI_MODEL || "gemini-pro";
const BASE =
  process.env.GOOGLE_GEMINI_ENDPOINT ||
  "https://generativelanguage.googleapis.com/v1beta2/models";

if (!API_KEY) {
  console.warn("WARNING: GOOGLE_API_KEY not set. Gemini calls will fail.");
}

// Helper to call the Gemini (Generative) API
async function callGemini(prompt: string) {
  const url = `${BASE}/${MODEL}:generate?key=${API_KEY}`;
  const body = {
    prompt: {
      // Using simple text prompt structure. Adjust if Google expects a different JSON shape.
      text: prompt,
    },
    temperature: 0.0,
    maxOutputTokens: 800,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini error ${res.status} ${txt}`);
  }

  const data = await res.json();
  // Response shape may vary depending on model/version. Try to extract plausible text.
  // Many Generative API responses put text in data.candidates[0].output or data.output[0].content.
  // We'll try a few common fields safely.
  const text =
    data?.candidates?.[0]?.content?.[0]?.text ||
    data?.candidates?.[0]?.output ||
    data?.output?.[0]?.content?.[0]?.text ||
    data?.candidates?.[0]?.content ||
    JSON.stringify(data);

  return String(text);
}

// 1) Create structured RFP
export async function createStructuredRFP(description: string) {
  const prompt = `
You are an assistant that converts a procurement description into a structured RFP JSON.
Input description:
"${description}"

Produce a JSON object only with fields:
{
  "title": string,
  "description": string,
  "budget": number|null,
  "deliveryTimeline": string|null,
  "items": [{"name": string, "qty": number, "specs": string|null}],
  "paymentTerms": string|null,
  "warranty": string|null
}

If a field is unknown, give null or an empty list. Do not add extra keys.
`;

  const reply = await callGemini(prompt);

  // Try to parse JSON from response — be tolerant.
  const jsonText = extractJSON(reply);
  if (!jsonText) {
    throw new Error("Failed to parse JSON from Gemini response: " + reply);
  }
  return JSON.parse(jsonText);
}

// 2) Parse vendor reply
export async function parseVendorReply(rawEmail: string) {
  const prompt = `
You are an assistant that extracts key proposal details from vendor replies.
Input (email body):
--------------------
${rawEmail}
--------------------

Return ONLY a JSON object with the fields:
{
  "vendor": string|null,
  "totalPrice": number|null,
  "unitPrices": { "<itemName>": number, ... } | {},
  "delivery": string|null,
  "warranty": string|null,
  "paymentTerms": string|null,
  "notes": string|null
}

Try to extract numeric prices where possible. If ambiguous, set null.
`;

  const reply = await callGemini(prompt);
  const jsonText = extractJSON(reply);
  if (!jsonText) {
    throw new Error("Failed to parse JSON from Gemini response: " + reply);
  }
  return JSON.parse(jsonText);
}

// 3) Compare proposals and recommend best vendor
export async function compareProposals(rfp: any, proposals: any[]) {
  const prompt = `
You are a procurement assistant. Given the RFP and the proposals, return a JSON object:
{
  "ranking": [ {"vendor": "<name>", "score": number, "reason": string } ],
  "recommendation": { "vendor": "<name>", "reason": string }
}

RFP:
${JSON.stringify(rfp, null, 2)}

Proposals:
${JSON.stringify(proposals, null, 2)}
`;

  const reply = await callGemini(prompt);
  const jsonText = extractJSON(reply);
  if (!jsonText) {
    // fallback to returning plain text
    return { text: reply };
  }
  return JSON.parse(jsonText);
}

// small helper that extracts the first JSON object substring from text
function extractJSON(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    // try to repair common mistakes: trailing commas
    const repaired = candidate.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    try {
      JSON.parse(repaired);
      return repaired;
    } catch {
      return null;
    }
  }
}
