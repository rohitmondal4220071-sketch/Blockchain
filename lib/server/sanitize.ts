// Input sanitization for AI prompts.

const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 2000;

export function sanitizeMessage(input: string): string {
  if (!input) return "";
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  if (cleaned.length > MAX_MESSAGE_LENGTH) cleaned = cleaned.slice(0, MAX_MESSAGE_LENGTH);
  return cleaned.trim();
}

export function sanitizeContext(input: string): string {
  if (!input) return "";
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  if (cleaned.length > MAX_CONTEXT_LENGTH) cleaned = cleaned.slice(0, MAX_CONTEXT_LENGTH);
  return cleaned.trim();
}

export function sanitizeOCRText(input: string): string {
  if (!input) return "";
  let cleaned = input.replace(/\x00/g, "").replace(/\s{10,}/g, " ");
  if (cleaned.length > 8000) cleaned = cleaned.slice(0, 8000);
  return cleaned.trim();
}
