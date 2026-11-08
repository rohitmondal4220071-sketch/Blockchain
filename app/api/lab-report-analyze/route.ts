import { NextResponse } from "next/server";
import { callGemini, getGeminiKey } from "@/lib/server/gemini";

export const runtime = "nodejs";

const SYSTEM = `You are a medical lab report interpreter. Given OCR text from a lab report, extract values and return ONLY valid JSON: {"isLabReport":true,"results":[{"parameter":"","value":"","normalRange":"","status":"normal|low|high"}],"explanation":"","abnormalFindings":[],"recommendations":""}. If the text is NOT a lab report, return {"isLabReport":false}. JSON only.`;

interface Payload { ocrText?: string; }

export async function POST(request: Request) {
  if (!getGeminiKey()) return NextResponse.json({ available: false, reason: "no-api-key" }, { status: 200 });

  let payload: Payload;
  try { payload = (await request.json()) as Payload; }
  catch { return NextResponse.json({ available: false, reason: "bad-request" }, { status: 400 }); }

  const { ocrText } = payload;
  if (!ocrText || ocrText.trim().length < 10) return NextResponse.json({ available: false, reason: "no-text" }, { status: 200 });

  try {
    const text = await callGemini({
      maxTokens: 1024, temperature: 0.2,
      systemInstruction: SYSTEM,
      contents: [{ role: "user", parts: [{ text: `Lab report OCR text:\n\n${ocrText}\n\nParse and return JSON.` }] }],
    });
    if (!text) return NextResponse.json({ available: false, reason: "empty" }, { status: 200 });
    return NextResponse.json({ available: true, raw: text }, { status: 200 });
  } catch (err) {
    console.error("[lab-report]", err);
    return NextResponse.json({ available: false, reason: "api-error" }, { status: 200 });
  }
}
