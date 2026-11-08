import { NextResponse } from "next/server";
import { callGemini } from "@/lib/server/gemini";
import { PRESCRIPTION_SYSTEM_PROMPT } from "@/lib/prescription";

export const runtime = "nodejs";

interface Payload { fileBase64?: string; mimeType?: string; ocrText?: string; }

export async function POST(request: Request) {
  // Use Gemini 3 Pro key specifically for Prescription
  const apiKey = process.env.OPENROUTER_GEMINI_KEY;
  const model = process.env.OPENROUTER_GEMINI_MODEL || "google/gemini-3.1-pro-preview";
  if (!apiKey) return NextResponse.json({ available: false, reason: "no-api-key" }, { status: 200 });

  let payload: Payload;
  try { payload = (await request.json()) as Payload; }
  catch { return NextResponse.json({ available: false, reason: "bad-request" }, { status: 400 }); }

  const { fileBase64, mimeType, ocrText } = payload;

  // Prefer OCR text (more reliable).
  if (ocrText && ocrText.trim().length > 10) {
    try {
      const text = await callGemini({
        apiKey, model,
        maxTokens: 1024, temperature: 0.2,
        systemInstruction: PRESCRIPTION_SYSTEM_PROMPT,
        contents: [{ role: "user", parts: [{ text: `OCR text from prescription:\n\n${ocrText}\n\nParse and return JSON.` }] }],
      });
      if (!text) return NextResponse.json({ available: false, reason: "empty" }, { status: 200 });
      return NextResponse.json({ available: true, raw: text }, { status: 200 });
    } catch (err) {
      console.error("[prescription-ocr]", err);
      return NextResponse.json({ available: false, reason: "api-error" }, { status: 200 });
    }
  }

  // Fallback: send image directly.
  if (!fileBase64 || !mimeType) return NextResponse.json({ available: false, reason: "missing-file" }, { status: 400 });
  if (mimeType.includes("pdf")) return NextResponse.json({ available: false, reason: "pdf-unsupported" }, { status: 200 });

  try {
    const text = await callGemini({
      apiKey, model,
      maxTokens: 1024, temperature: 0.2,
      contents: [{
        parts: [
          { text: PRESCRIPTION_SYSTEM_PROMPT },
          { inline_data: { mime_type: mimeType, data: fileBase64 } },
        ],
      }],
    });
    if (!text) return NextResponse.json({ available: false, reason: "empty" }, { status: 200 });
    return NextResponse.json({ available: true, raw: text }, { status: 200 });
  } catch (err) {
    console.error("[prescription-vision]", err);
    return NextResponse.json({ available: false, reason: "api-error" }, { status: 200 });
  }
}
