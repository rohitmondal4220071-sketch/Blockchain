// OCR text validation for medical documents. Used to reject random/invalid
// uploads BEFORE sending to the AI, preventing fake results.

const LAB_KEYWORDS = [
  "hemoglobin", "wbc", "rbc", "platelet", "blood sugar", "glucose",
  "cholesterol", "hdl", "ldl", "triglyceride", "creatinine", "urea",
  "sgpt", "sgot", "cbc", "lft", "kft", "test", "result", "unit",
  "normal range", "reference range", "lab", "patient", "report",
  "hematology", "biochemistry", "serum", "plasma", "specimen",
  "bilirubin", "albumin", "protein", "sodium", "potassium",
];

const PRESCRIPTION_KEYWORDS = [
  "rx", "tab", "tablet", "cap", "capsule", "syrup", "injection",
  "dose", "dosage", "morning", "night", "afternoon", "before food",
  "after food", "doctor", "dr.", "medicine", "prescription",
  "diagnosis", "symptoms", "mg", "ml", "times daily", "once daily",
  "twice daily", "sos", "prn", "od", "bd", "tds", "qid",
];

const MEDICAL_DOC_KEYWORDS = [
  "report", "diagnosis", "impression", "findings", "prescription",
  "lab", "test", "patient", "doctor", "clinical", "medical",
  "result", "advice", "follow-up", "history", "examination",
  "treatment", "investigation", "radiology", "pathology",
];

function countKeywordMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw)).length;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validates OCR text as a lab report. Rejects if text is too short or
 * contains no medical/lab keywords.
 */
export function validateLabReport(ocrText: string): ValidationResult {
  const trimmed = ocrText.trim();
  if (trimmed.length < 30) {
    return { isValid: false, reason: "This does not appear to be a valid lab report. The image contains too little readable text. Please upload a clear blood test or laboratory report." };
  }
  const matches = countKeywordMatches(trimmed, LAB_KEYWORDS);
  if (matches < 2) {
    return { isValid: false, reason: "This does not appear to be a valid lab report. No medical or laboratory values were detected. Please upload a clear blood test or laboratory report." };
  }
  return { isValid: true };
}

/**
 * Validates OCR text as a prescription. Rejects if text is too short or
 * contains no prescription/medicine keywords.
 */
export function validatePrescription(ocrText: string): ValidationResult {
  const trimmed = ocrText.trim();
  if (trimmed.length < 20) {
    return { isValid: false, reason: "This does not appear to be a valid prescription. The image contains too little readable text. Please upload a clear prescription image." };
  }
  const matches = countKeywordMatches(trimmed, PRESCRIPTION_KEYWORDS);
  if (matches < 2) {
    return { isValid: false, reason: "This does not appear to be a valid prescription. No medicine or dosage information was detected. Please upload a clear prescription image." };
  }
  return { isValid: true };
}

/**
 * Validates OCR text as a medical document. Rejects if text is too short or
 * contains no medical keywords.
 */
export function validateMedicalDocument(ocrText: string): ValidationResult {
  const trimmed = ocrText.trim();
  if (trimmed.length < 30) {
    return { isValid: false, reason: "This does not appear to be a valid medical document. The image contains too little readable text. Please upload a medical report, prescription, or lab document." };
  }
  const matches = countKeywordMatches(trimmed, MEDICAL_DOC_KEYWORDS);
  if (matches < 2) {
    return { isValid: false, reason: "This does not appear to be a valid medical document. No medical content was detected. Please upload a medical report, prescription, or lab document." };
  }
  return { isValid: true };
}
