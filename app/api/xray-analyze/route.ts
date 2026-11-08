import { NextResponse } from "next/server";
import { callGemini, extractJSON } from "@/lib/server/gemini";

export const runtime = "nodejs";

const PROMPT = `Look at this image. Is it a medical X-ray? If NOT an X-ray, set isXray to false. If it IS an X-ray, identify the body part (Chest, Hand, Leg, Knee, Skull, Spine, Foot, Shoulder, Arm, or Other). Return ONLY valid JSON: {"isXray":boolean,"bodyPart":"","confidence":0,"explanation":""}. Do NOT diagnose disease. JSON only.`;

interface Payload { imageBase64?: string; mimeType?: string; }

export async function POST(request: Request) {
  // Use Gemini 3 Pro key specifically for X-Ray
  const apiKey = process.env.OPENROUTER_GEMINI_KEY;
  const model = process.env.OPENROUTER_GEMINI_MODEL || "google/gemini-3.1-pro-preview";
  if (!apiKey) return NextResponse.json({ available: false, reason: "no-api-key" }, { status: 200 });

  let payload: Payload;
  try { payload = (await request.json()) as Payload; }
  catch { return NextResponse.json({ available: false, reason: "bad-request" }, { status: 400 }); }

  const { imageBase64, mimeType } = payload;
  if (!imageBase64 || !mimeType) return NextResponse.json({ available: false, reason: "missing-image" }, { status: 400 });

  try {
    const text = await callGemini({
      apiKey, model,
      maxTokens: 1024, temperature: 0.2,
      contents: [{
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      }],
    });
    const parsed = extractJSON(text);
    if (!parsed) return NextResponse.json({ available: false, reason: "parse-error" }, { status: 200 });
    return NextResponse.json({ available: true, result: parsed }, { status: 200 });
  } catch (err) {
    console.error("[xray]", err);
    return NextResponse.json({ available: false, reason: "api-error" }, { status: 200 });
  }
}
