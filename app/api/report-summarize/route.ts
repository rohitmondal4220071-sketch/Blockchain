import { NextResponse } from "next/server";
import { callGemini, getGeminiKey } from "@/lib/server/gemini";

export const runtime = "nodejs";

const SYSTEM = `You are a medical document summarizer. Return ONLY valid JSON: {"shortSummary":"","keyFindings":[],"warnings":[],"nextActions":[],"patientFriendly":"","doctorSummary":""}. Be concise. JSON only.`;

interface Payload { text?: string; }

export async function POST(request: Request) {
  if (!getGeminiKey()) return NextResponse.json({ available: false, reason: "no-api-key" }, { status: 200 });

  let payload: Payload;
  try { payload = (await request.json()) as Payload; }
  catch { return NextResponse.json({ available: false, reason: "bad-request" }, { status: 400 }); }

  const { text } = payload;
  if (!text || text.trim().length < 10) return NextResponse.json({ available: false, reason: "no-text" }, { status: 200 });

  try {
    const reply = await callGemini({
      maxTokens: 1024, temperature: 0.3,
      systemInstruction: SYSTEM,
      contents: [{ role: "user", parts: [{ text: `Summarize this medical document:\n\n${text}` }] }],
    });
    if (!reply) return NextResponse.json({ available: false, reason: "empty" }, { status: 200 });
    return NextResponse.json({ available: true, raw: reply }, { status: 200 });
  } catch (err) {
    console.error("[summarizer]", err);
    return NextResponse.json({ available: false, reason: "api-error" }, { status: 200 });
  }
}
