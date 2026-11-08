"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Camera, Check, FileText, Loader2, Pill, Plus, ScanLine, Upload, X } from "lucide-react";
import { storageService, type Medicine, type MedicineSlot } from "@/lib/storage";
import {
  normalizePrescription,
  safeParseJSON,
  validatePrescriptionFile,
  type ExtractedMedicine,
  type PrescriptionData,
} from "@/lib/prescription";
import { extractTextFromImage } from "@/lib/ocr/tesseract";
import { validatePrescription } from "@/lib/ocr/validate";
import { GlassButton, GlassCard, SectionTitle } from "./ui";

interface PrescriptionScannerProps {
  onMedicinesExtracted: () => void;
}

/** Maps an AI failure reason to an honest, user-facing message. */
function messageForFailure(reason: string | null): string {
  switch (reason) {
    case "not-a-prescription":
      return "This image does not appear to be a prescription, or no medicines could be read from it. Please upload a clear photo of a prescription, or add medicines manually from the Medicine tab.";
    case "insufficient-credits":
      return "The AI service is temporarily unavailable (API credit limit reached). Please try again later or add medicines manually from the Medicine tab.";
    case "no-api-key":
      return "AI extraction isn't configured. Add an Anthropic/OpenRouter API key to enable it, or add medicines manually from the Medicine tab.";
    case "pdf-unsupported":
      return "PDF analysis isn't supported yet. Please upload a clear photo (PNG/JPG/WEBP) of the prescription, or add medicines manually.";
    case "network":
      return "Couldn't reach the AI service. Check your connection and try again, or add medicines manually from the Medicine tab.";
    case "parse-error":
    case "empty":
      return "The prescription couldn't be read clearly. Please upload a sharper photo, or add medicines manually from the Medicine tab.";
    default:
      return "Couldn't analyze this file. Please try a clearer prescription photo, or add medicines manually from the Medicine tab.";
  }
}

const FOOD_LABEL: Record<ExtractedMedicine["food"], string> = {
  beforeFood: "Before food",
  afterFood: "After food",
  any: "Any time",
};
const SLOT_TIME: Record<MedicineSlot, string> = {
  morning: "08:00",
  afternoon: "14:00",
  night: "21:00",
};

function dataUrlToBase64(dataUrl: string): { base64: string; mimeType: string } {
  const [meta, data] = dataUrl.split(",");
  const mimeType = meta.match(/data:(.*?);/)?.[1] ?? "application/octet-stream";
  return { base64: data ?? "", mimeType };
}

export function PrescriptionScanner({ onMedicinesExtracted }: PrescriptionScannerProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PrescriptionData | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  const hasFile = dataUrl !== null;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    const validation = validatePrescriptionFile(file);
    if (!validation.ok) {
      setError(validation.error ?? "Invalid file.");
      return;
    }
    setFileName(file!.name);
    setIsPdf(file!.type === "application/pdf");
    setData(null);
    setSelected(new Set());
    const reader = new FileReader();
    reader.onloadend = () => setDataUrl(reader.result as string);
    reader.onerror = () => setError("Could not read the file. Please try another file.");
    reader.readAsDataURL(file!);
  };

  const process = async () => {
    if (!dataUrl) {
      setError("No file selected. Please upload a prescription.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    cancelledRef.current = false;

    let extracted: PrescriptionData | null = null;
    let failureReason: string | null = null;

    try {
      const { base64, mimeType } = dataUrlToBase64(dataUrl);

      // Step 1: Run OCR on the image to extract text (more reliable than vision-only).
      let ocrText = "";
      if (!isPdf) {
        ocrText = await extractTextFromImage(dataUrl);
      }

      // Step 2: Validate OCR text — reject if not a prescription.
      if (!isPdf && ocrText) {
        const validation = validatePrescription(ocrText);
        if (!validation.isValid) {
          failureReason = "not-a-prescription";
          setIsProcessing(false);
          setError(validation.reason || "This does not appear to be a valid prescription.");
          return;
        }
      }

      // Step 3: Send to AI (with OCR text if available, else image).
      const res = await fetch("/api/prescription-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64: base64, mimeType, ocrText }),
      });
      const json = (await res.json()) as {
        available: boolean;
        raw?: string;
        reason?: string;
      };

      if (cancelledRef.current) return;

      if (json.available && json.raw) {
        const parsed = safeParseJSON(json.raw);
        if (parsed) {
          const normalized = normalizePrescription(parsed);
          if (
            normalized.isPrescription &&
            (normalized.medicines.length > 0 ||
              normalized.prescriptionSummary !== "Not clearly mentioned")
          ) {
            extracted = normalized;
          } else {
            failureReason = "not-a-prescription";
          }
        } else {
          failureReason = "parse-error";
        }
      } else {
        failureReason = json.reason ?? "unavailable";
      }
    } catch {
      failureReason = "network";
    }

    if (cancelledRef.current) return;

    if (extracted) {
      setData(extracted);
      setSelected(new Set(extracted.medicines.map((_, i) => i)));
      setIsProcessing(false);
      return;
    }

    // NEVER fabricate prescription data. Show an honest, specific message.
    setIsProcessing(false);
    setError(messageForFailure(failureReason));
  };

  const toggle = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  const reset = () => {
    cancelledRef.current = true;
    setDataUrl(null);
    setIsPdf(false);
    setFileName("");
    setData(null);
    setSelected(new Set());
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const addSelected = () => {
    if (!data) return;
    const existing = storageService.getMedicines();
    const prescriptionId = Date.now().toString();
    const newMeds: Medicine[] = [];

    data.medicines
      .filter((_, i) => selected.has(i))
      .forEach((med, mi) => {
        const slots = med.timing.length ? med.timing : (["morning"] as MedicineSlot[]);
        slots.forEach((slot, si) => {
          newMeds.push({
            id: `${prescriptionId}-${mi}-${si}`,
            name: med.name,
            dosage: med.dosage,
            time: SLOT_TIME[slot],
            frequency: med.frequency,
            taken: false,
            status: "pending",
            slot,
            foodTiming: med.food === "beforeFood" ? "before" : med.food === "afterFood" ? "after" : "any",
            duration: med.duration,
            notes: med.specialInstructions,
            prescriptionId,
          });
        });
      });

    storageService.saveMedicines([...existing, ...newMeds]);
    storageService.savePrescription({
      id: prescriptionId,
      imageUrl: isPdf ? undefined : dataUrl || undefined,
      extractedText: data.prescriptionSummary,
      medicines: newMeds,
      doctorName: data.doctorName,
      symptoms: data.symptomsOrDiagnosis,
      diagnosis: data.symptomsOrDiagnosis,
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    });

    reset();
    onMedicinesExtracted();
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <ScanLine className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Prescription Scanner</h2>
            <p className="mt-1 text-sm text-white/60">
              Upload a prescription image or PDF to extract medicines and create reminders. Falls
              back to demo data when no AI key is configured.
            </p>
          </div>
        </div>
      </GlassCard>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/15">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-white/80" strokeWidth={1.5} />
          <p className="text-sm text-white/80">{error}</p>
        </div>
      )}

      {!hasFile && (
        <GlassCard>
          <div className="rounded-xl border-2 border-dashed border-white/15 p-8 text-center transition hover:border-white/30">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/10">
              <FileText className="h-8 w-8 text-white/70" strokeWidth={1.25} />
            </div>
            <p className="mb-2 font-medium text-white">Upload Prescription</p>
            <p className="mb-6 text-sm text-white/50">PNG, JPG, JPEG, WEBP, or PDF · up to 15MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
              onChange={handleUpload}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <GlassButton variant="ghost" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Choose File
              </GlassButton>
              <GlassButton onClick={() => cameraInputRef.current?.click()}>
                <Camera className="h-4 w-4" /> Take Photo
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {hasFile && !data && (
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-medium text-white">Preview</h3>
            <button
              onClick={reset}
              aria-label="Cancel scan"
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80 outline-none transition hover:scale-105 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X className="h-4 w-4" /> Cancel Scan
            </button>
          </div>
          <div className="mb-4 flex max-h-[400px] items-center justify-center overflow-hidden rounded-xl bg-white/5 p-2">
            {isPdf ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <FileText className="h-12 w-12 text-white/70" strokeWidth={1.25} />
                <p className="text-sm font-medium text-white">{fileName || "Prescription.pdf"}</p>
                <p className="text-xs text-white/50">PDF ready for extraction</p>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl ?? ""}
                alt="Prescription preview"
                className="mx-auto max-h-[380px] object-contain"
              />
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <GlassButton onClick={process} disabled={isProcessing} className="flex-1 justify-center">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <ScanLine className="h-4 w-4" /> Extract Medications
                </>
              )}
            </GlassButton>
            <button
              onClick={reset}
              aria-label="Cancel scan"
              className="flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 outline-none transition hover:scale-105 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X className="h-4 w-4" /> {isProcessing ? "Cancel" : "Cancel Scan"}
            </button>
          </div>
        </GlassCard>
      )}

      {data && (
        <>
          <GlassCard>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SectionTitle icon={<Check className="h-4 w-4 text-white" />}>
                  Extraction Complete
                </SectionTitle>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">
                  AI Mode
                </span>
              </div>
              <button
                onClick={reset}
                aria-label="Cancel scan"
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80 outline-none transition hover:scale-105 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <X className="h-4 w-4" /> Cancel Scan
              </button>
            </div>

            {/* Summary */}
            <div className="mb-4 rounded-lg bg-white/5 p-3">
              <p className="text-xs text-white/50">Prescription Summary</p>
              <p className="text-sm text-white">{data.prescriptionSummary}</p>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-xs text-white/50">Doctor</p>
                <p className="text-sm text-white">{data.doctorName}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-xs text-white/50">Symptoms / Diagnosis</p>
                <p className="text-sm text-white">{data.symptomsOrDiagnosis}</p>
              </div>
            </div>

            <p className="mb-3 text-sm font-medium text-white">Extracted Medications</p>
            {data.medicines.length === 0 ? (
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-sm text-white/70">No medicines were detected.</p>
                <p className="mt-1 text-xs text-white/50">
                  You can add them manually from the Medicine tab after closing this scan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.medicines.map((med, i) => (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    className={`flex w-full items-start gap-4 rounded-xl p-4 text-left transition ${
                      selected.has(i) ? "bg-white/15 ring-1 ring-white/30" : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      {selected.has(i) ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <Pill className="h-5 w-5 text-white/60" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{med.name}</p>
                      <p className="text-sm text-white/50">
                        {med.dosage} · {med.frequency}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] capitalize text-white/70">
                          {med.timing.join(", ")}
                        </span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                          {FOOD_LABEL[med.food]}
                        </span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                          {med.duration}
                        </span>
                      </div>
                      {med.specialInstructions && med.specialInstructions !== "Not clearly mentioned" && (
                        <p className="mt-1 text-xs text-white/50">{med.specialInstructions}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </GlassCard>

          {(data.followUpAdvice || data.warnings) && (
            <GlassCard>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-white/50">Follow-up Advice</p>
                  <p className="text-sm text-white/80">{data.followUpAdvice}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Warnings</p>
                  <p className="text-sm text-white/80">{data.warnings}</p>
                </div>
              </div>
            </GlassCard>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <GlassButton
              onClick={addSelected}
              disabled={selected.size === 0}
              className="flex-1 justify-center"
            >
              <Plus className="h-4 w-4" /> Add {selected.size} Reminder{selected.size !== 1 ? "s" : ""} to
              Schedule
            </GlassButton>
            <GlassButton variant="ghost" onClick={reset}>
              <X className="h-4 w-4" /> Reset Scan
            </GlassButton>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-white/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-white/70" strokeWidth={1.5} />
            <p className="text-xs text-white/60">
              This AI extracts and organizes prescription information for reminder support only.
              Always verify medicine name, dosage, timing, and duration with a certified doctor or
              pharmacist.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
