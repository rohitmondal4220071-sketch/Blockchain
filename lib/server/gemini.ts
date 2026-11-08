// Server-only AI utility using OpenRouter (Claude Opus 4.8 Fast).
// NEVER import into client components.

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

export function getGeminiKey(): string | null {
  return process.env.OPENROUTER_API_KEY || null;
}

export interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

interface ContentItem {
  role?: string;
  parts: GeminiPart[];
}

interface CallOptions {
  model?: string;
  apiKey?: string;
  contents: ContentItem[];
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Calls OpenRouter's chat completions with Claude Opus 4.8 Fast (default)
 * or a specified model/key override.
 */
export async function callGemini({
  contents,
  systemInstruction,
  maxTokens = 300,
  temperature = 0.4,
  apiKey: overrideKey,
  model: overrideModel,
}: CallOptions): Promise<string> {
  const apiKey = overrideKey || process.env.OPENROUTER_API_KEY;
  const model = overrideModel || process.env.OPENROUTER_MODEL || "anthropic/claude-opus-4.8-fast";
  if (!apiKey) throw new Error("No OPENROUTER_API_KEY");

  // Convert contents (Gemini format) to OpenAI messages format.
  const messages: { role: string; content: string | { type: string; text?: string; image_url?: { url: string } }[] }[] = [];

  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }

  for (const item of contents) {
    const role = item.role === "model" ? "assistant" : "user";
    
    // Check if any part has inline_data (image).
    const hasImage = item.parts.some(p => p.inline_data);
    
    if (hasImage) {
      const contentParts: { type: string; text?: string; image_url?: { url: string } }[] = [];
      for (const part of item.parts) {
        if (part.text) {
          contentParts.push({ type: "text", text: part.text });
        }
        if (part.inline_data) {
          contentParts.push({
            type: "image_url",
            image_url: { url: `data:${part.inline_data.mime_type};base64,${part.inline_data.data}` },
          });
        }
      }
      messages.push({ role, content: contentParts });
    } else {
      // Text-only: join all text parts.
      const text = item.parts.map(p => p.text || "").join("");
      messages.push({ role, content: text });
    }
  }

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

/** Extracts the first JSON object from a model response. */
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
