// Prescription analysis helpers: file validation, strict JSON normalization,
// and demo fallback data. Shared between the client component and API route.

export const PRESCRIPTION_ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_PRESCRIPTION_BYTES = 15 * 1024 * 1024; // 15MB

export const NOT_MENTIONED = "Not clearly mentioned";

export type MedicineSlot = "morning" | "afternoon" | "night";
export type FoodTiming = "beforeFood" | "afterFood" | "any";

export interface ExtractedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  timing: MedicineSlot[];
  food: FoodTiming;
  duration: string;
  specialInstructions: string;
}

export interface PrescriptionData {
  isPrescription: boolean;
  patientName: string;
  doctorName: string;
  symptomsOrDiagnosis: string;
  prescriptionSummary: string;
  medicines: ExtractedMedicine[];
  followUpAdvice: string;
  warnings: string;
}

export interface PrescriptionResult {
  data: PrescriptionData;
  mode: "ai" | "demo";
  notice?: string;
}

export interface FileValidation {
  ok: boolean;
  error?: string;
}

export function validatePrescriptionFile(file: File | null | undefined): FileValidation {
  if (!file) return { ok: false, error: "No file selected. Please upload a prescription." };
  const type = file.type.toLowerCase();
  if (!(PRESCRIPTION_ACCEPTED_TYPES as readonly string[]).includes(type)) {
    return {
      ok: false,
      error: "Unsupported format. Please upload a PNG, JPG, JPEG, WEBP, or PDF file.",
    };
  }
  if (file.size > MAX_PRESCRIPTION_BYTES) {
    return { ok: false, error: "File is too large. Please upload a file under 15MB." };
  }
  return { ok: true };
}

function asString(value: unknown, fallback = NOT_MENTIONED): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function normalizeTiming(value: unknown): MedicineSlot[] {
  const slots: MedicineSlot[] = [];
  const push = (s: MedicineSlot) => {
    if (!slots.includes(s)) slots.push(s);
  };
  const scan = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes("morning") || t.includes("am") || t.includes("breakfast")) push("morning");
    if (t.includes("afternoon") || t.includes("noon") || t.includes("lunch")) push("afternoon");
    if (t.includes("night") || t.includes("evening") || t.includes("pm") || t.includes("dinner") || t.includes("bed"))
      push("night");
  };
  if (Array.isArray(value)) {
    value.forEach((v) => typeof v === "string" && scan(v));
  } else if (typeof value === "string") {
    scan(value);
  }
  return slots.length ? slots : ["morning"];
}

function normalizeFood(value: unknown): FoodTiming {
  const t = asString(value, "").toLowerCase();
  if (t.includes("before")) return "beforeFood";
  if (t.includes("after")) return "afterFood";
  return "any";
}

function normalizeMedicine(raw: unknown): ExtractedMedicine | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = asString(r.name ?? r.medicine ?? r.medicineName, "");
  if (!name) return null;
  return {
    name,
    dosage: asString(r.dosage),
    frequency: asString(r.frequency),
    timing: normalizeTiming(r.timing ?? r.time ?? r.schedule),
    food: normalizeFood(r.food ?? r.beforeFood ?? r.afterFood ?? r.foodTiming),
    duration: asString(r.duration),
    specialInstructions: asString(r.specialInstructions ?? r.instructions),
  };
}

/**
 * Normalizes/repairs arbitrary parsed JSON into a guaranteed-valid
 * PrescriptionData. Missing fields become "Not clearly mentioned"; invalid
 * medicines are dropped. Never throws.
 */
export function normalizePrescription(raw: unknown): PrescriptionData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const medicinesRaw = Array.isArray(r.medicines) ? r.medicines : [];
  const medicines = medicinesRaw
    .map(normalizeMedicine)
    .filter((m): m is ExtractedMedicine => m !== null);

  return {
    isPrescription: r.isPrescription !== false,
    patientName: asString(r.patientName),
    doctorName: asString(r.doctorName),
    symptomsOrDiagnosis: asString(r.symptomsOrDiagnosis ?? r.symptoms ?? r.diagnosis),
    prescriptionSummary: asString(r.prescriptionSummary ?? r.summary),
    medicines,
    followUpAdvice: asString(r.followUpAdvice ?? r.followUp),
    warnings: asString(r.warnings),
  };
}

/**
 * Attempts to extract a JSON object from a possibly-noisy model string
 * (handles ```json fences and surrounding prose). Returns null on failure.
 */
export function safeParseJSON(text: string): unknown {
  if (!text) return null;
  // Strip code fences.
  let cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  // Grab the outermost {...} if there's surrounding prose.
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

/** Sample prescription used for demo mode / fallback. */
export function demoPrescription(): PrescriptionData {
  return {
    isPrescription: true,
    patientName: NOT_MENTIONED,
    doctorName: "Dr. Sarah Johnson",
    symptomsOrDiagnosis: "Sore throat, mild fever, acid reflux (bacterial throat infection with gastritis)",
    prescriptionSummary:
      "Doctor appears to have prescribed medicines for: throat infection, fever, and acid reflux.",
    medicines: [
      {
        name: "Amoxicillin",
        dosage: "500mg",
        frequency: "3 times daily",
        timing: ["morning", "afternoon", "night"],
        food: "afterFood",
        duration: "7 days",
        specialInstructions: "Complete the full course.",
      },
      {
        name: "Ibuprofen",
        dosage: "400mg",
        frequency: "Twice daily",
        timing: ["afternoon", "night"],
        food: "afterFood",
        duration: "5 days",
        specialInstructions: "Take only if fever or pain persists.",
      },
      {
        name: "Omeprazole",
        dosage: "20mg",
        frequency: "Once daily",
        timing: ["morning"],
        food: "beforeFood",
        duration: "14 days",
        specialInstructions: "Take before breakfast.",
      },
    ],
    followUpAdvice: "Follow up in 2 weeks if symptoms persist.",
    warnings: "Avoid alcohol while on antibiotics.",
  };
}

export const PRESCRIPTION_SYSTEM_PROMPT = `You are a medical prescription parser. You are shown ONE image.

STEP 1 — Decide if the image is genuinely a medical prescription (a doctor's Rx, medication list, or pharmacy label). Photos of objects, people, scenery, screenshots, or unrelated documents are NOT prescriptions.

STEP 2 — If and only if it IS a prescription, extract the details.

Return ONLY valid JSON (no markdown, no prose) matching exactly this shape:
{
  "isPrescription": boolean,     // false for any non-prescription image
  "patientName": string,
  "doctorName": string,
  "symptomsOrDiagnosis": string,
  "prescriptionSummary": string,
  "medicines": [
    {
      "name": string,
      "dosage": string,
      "frequency": string,
      "timing": string[],            // any of "morning","afternoon","night"
      "food": string,                // "beforeFood" | "afterFood" | "any"
      "duration": string,
      "specialInstructions": string
    }
  ],
  "followUpAdvice": string,
  "warnings": string
}

Rules:
- If the image is NOT a prescription, set "isPrescription": false and return an empty "medicines" array. Do NOT invent medicines.
- Only include medicines that are actually written in the image. Never guess or add common drugs that are not present.
- If a field is unknown, use "Not clearly mentioned".
- Output JSON only.`;
