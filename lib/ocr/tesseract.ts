// Client-side OCR using Tesseract.js. Used by Prescription Scanner and
// Lab Report Analyzer to extract text from uploaded images before sending
// to the AI for structured interpretation.
// Supports English, Hindi, and Bengali.

import { createWorker } from "tesseract.js";

let workerPromise: Promise<Awaited<ReturnType<typeof createWorker>>> | null = null;

/**
 * Lazily initializes a shared Tesseract worker with English + Hindi + Bengali.
 * Multiple languages are separated by '+' in the lang string.
 */
function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng+hin+ben");
  }
  return workerPromise;
}

/**
 * Extracts text from an image data URL using Tesseract.js OCR.
 * Supports English, Hindi, and Bengali scripts.
 * Returns the recognized text, or an empty string on failure.
 */
export async function extractTextFromImage(imageDataUrl: string): Promise<string> {
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(imageDataUrl);
    return data.text.trim();
  } catch (err) {
    console.error("[OCR] Tesseract extraction failed:", err);
    return "";
  }
}
