// Server-only OpenRouter utility. NEVER import into client components.
// Calls the OpenRouter chat completions API with the given key and model.

const BASE_URL = process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface CallOptions {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

/**
 * Calls OpenRouter's chat completions endpoint. Returns the assistant text.
 * Throws on any non-OK response so callers can fall back.
 */
export async function callOpenRouter({
  apiKey,
  model,
  messages,
  maxTokens = 700,
  temperature = 0.4,
}: CallOptions): Promise<string> {
  if (!apiKey) throw new Error("No API key provided");

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://mediscan-ai.local",
      "X-Title": "MediScan AI",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

/** Extracts the first JSON object from a possibly-noisy model response. */
export function extractJSON(text: string): unknown {
  if (!text) return null;
  let cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/** Builds a data URL for inline image content. */
export function imageDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

/** Gets the key for a specific feature, with fallback chain. */
export function getKeyForFeature(feature: "xray" | "prescription" | "lab" | "summarizer" | "assistant"): { key: string; model: string } | null {
  const env = process.env;
  switch (feature) {
    case "xray":
      if (env.OPENROUTER_GEMINI_3_PRO_KEY) return { key: env.OPENROUTER_GEMINI_3_PRO_KEY, model: env.MODEL_XRAY || "gemini-3-pro" };
      break;
    case "prescription":
      if (env.OPENROUTER_GEMINI_3_PRO_KEY) return { key: env.OPENROUTER_GEMINI_3_PRO_KEY, model: env.MODEL_PRESCRIPTION || "gemini-3-pro" };
      break;
    case "lab":
      if (env.OPENROUTER_GPT_5_4_KEY) return { key: env.OPENROUTER_GPT_5_4_KEY, model: env.MODEL_LAB_REPORT || "gpt-5.4" };
      break;
    case "summarizer":
      if (env.OPENROUTER_GPT_5_4_KEY) return { key: env.OPENROUTER_GPT_5_4_KEY, model: env.MODEL_SUMMARIZER || "gpt-5.4" };
      break;
    case "assistant":
      if (env.OPENROUTER_OPUS_4_8_FAST_KEY) return { key: env.OPENROUTER_OPUS_4_8_FAST_KEY, model: env.MODEL_AI_ASSISTANT || "opus-4.8-fast" };
      break;
  }
  // Fallback chain
  if (env.OPENROUTER_DEEPSEEK_V4_KEY) return { key: env.OPENROUTER_DEEPSEEK_V4_KEY, model: env.MODEL_FALLBACK || "deepseek-v4" };
  if (env.OPENROUTER_NOVA_MICRO_KEY) return { key: env.OPENROUTER_NOVA_MICRO_KEY, model: env.MODEL_LIGHT_FALLBACK || "amazon-nova-micro" };
  return null;
}
