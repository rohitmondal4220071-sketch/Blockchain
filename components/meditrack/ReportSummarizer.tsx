"use client";

import { useRef, useState } from "react";
import { AlertTriangle, BookOpen, Download, FileText, Loader2, Send, Upload, X } from "lucide-react";
import { extractTextFromImage } from "@/lib/ocr/tesseract";
import { validateMedicalDocument } from "@/lib/ocr/validate";
import { GlassButton, GlassCard, SectionTitle } from "./ui";

interface Summary { shortSummary: string; keyFindings: string[]; warnings: string[]; nextActions: string[]; patientFriendly: string; doctorSummary: string; }

const STORAGE_KEY = "mediscan_report_summaries";
function loadSummaries(): Summary[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function saveSummaries(s: Summary[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s.slice(0, 20))); }

export function ReportSummarizer() {
  const [file, setFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setError(null); setSummary(null);
    const reader = new FileReader();
    reader.onloadend = () => setFile(reader.result as string);
    reader.readAsDataURL(f);
  };

  const summarize = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      // Step 1: OCR extraction.
      const ocrText = await extractTextFromImage(file);

      // Step 2: Validate — reject if not a medical document.
      const validation = validateMedicalDocument(ocrText);
      if (!validation.isValid) {
        setError(validation.reason || "Invalid upload.");
        setLoading(false);
        return;
      }

      // Step 3: Send to the summarizer AI route.
      const res = await fetch("/api/report-summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ocrText }),
      });
      const data = (await res.json()) as { available: boolean; raw?: string };

      if (data.available && data.raw) {
        let cleaned = data.raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
        const first = cleaned.indexOf("{");
        const last = cleaned.lastIndexOf("}");
        if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
        try {
          const parsed = JSON.parse(cleaned);
          const result: Summary = {
            shortSummary: parsed.shortSummary || "Summary generated.",
            keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
            warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
            nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions : [],
            patientFriendly: parsed.patientFriendly || parsed.shortSummary || "",
            doctorSummary: parsed.doctorSummary || "",
          };
          setSummary(result);
          saveSummaries([result, ...loadSummaries()]);
        } catch {
          setError("Could not parse the AI response. Please try again with a clearer document.");
        }
      } else {
        setError("AI summarization unavailable (API key may be missing). Please configure your OpenRouter keys.");
      }
    } catch { setError("Failed to summarize. Check your connection."); }
    finally { setLoading(false); }
  };

  const exportSummary = () => {
    if (!summary) return;
    const text = `MEDICAL REPORT SUMMARY\n${"=".repeat(40)}\n\nShort Summary:\n${summary.shortSummary}\n\nKey Findings:\n${summary.keyFindings.map(f => "• " + f).join("\n")}\n\nWarnings:\n${summary.warnings.map(w => "⚠ " + w).join("\n")}\n\nNext Actions:\n${summary.nextActions.map(a => "→ " + a).join("\n")}\n\nPatient-Friendly:\n${summary.patientFriendly}\n\nDoctor Summary:\n${summary.doctorSummary}\n\n${"=".repeat(40)}\nDisclaimer: This is not a medical diagnosis.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `report-summary-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setSummary(null); setError(null); if (fileRef.current) fileRef.current.value = ""; };

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><BookOpen className="h-6 w-6 text-white" strokeWidth={1.5} /></div>
          <div><h2 className="text-lg font-medium text-white">Medical Report Summarizer</h2><p className="mt-1 text-sm text-white/60">Upload any medical document for AI-generated summaries using OCR + GPT 5.4.</p></div>
        </div>
      </GlassCard>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/15">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
          <div><p className="text-sm text-white/80">{error}</p><p className="mt-1 text-xs text-white/50">Upload rejected — no sample data shown.</p></div>
        </div>
      )}

      {!file && (
        <GlassCard>
          <div className="rounded-xl border-2 border-dashed border-white/15 p-8 text-center hover:border-white/30 transition">
            <FileText className="mx-auto mb-4 h-12 w-12 text-white/50" strokeWidth={1.25} />
            <p className="mb-2 font-medium text-white">Upload Medical Document</p>
            <p className="mb-6 text-sm text-white/50">PDF, image, or any medical report</p>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleUpload} className="hidden" />
            <GlassButton onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Choose File</GlassButton>
          </div>
        </GlassCard>
      )}

      {file && !summary && !error && (
        <GlassCard>
          <div className="mb-4 flex items-center justify-between"><h3 className="text-base font-medium text-white">Ready to Summarize</h3><button onClick={reset} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80 hover:bg-white/15 transition"><X className="h-4 w-4" /> Cancel</button></div>
          <GlassButton onClick={summarize} disabled={loading} className="w-full justify-center">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Summarizing (OCR + AI)…</> : <><Send className="h-4 w-4" /> Generate Summary</>}
          </GlassButton>
        </GlassCard>
      )}

      {file && error && (
        <GlassCard><GlassButton onClick={reset} className="w-full justify-center"><X className="h-4 w-4" /> Reset & Try Another</GlassButton></GlassCard>
      )}

      {summary && (
        <>
          <GlassCard>
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle icon={<BookOpen className="h-5 w-5 text-white" strokeWidth={1.5} />}>Summary</SectionTitle>
              <div className="flex gap-2">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">AI Mode</span>
                <GlassButton variant="ghost" onClick={exportSummary}><Download className="h-4 w-4" /> Export</GlassButton>
                <button onClick={reset} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80 hover:bg-white/15 transition"><X className="h-4 w-4" /> New</button>
              </div>
            </div>
            <p className="text-sm text-white/80">{summary.shortSummary}</p>
          </GlassCard>
          {summary.keyFindings.length > 0 && <GlassCard><p className="mb-2 text-xs font-medium text-white/50">Key Findings</p><ul className="space-y-1">{summary.keyFindings.map((f, i) => <li key={i} className="flex items-start gap-2 text-sm text-white/80"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />{f}</li>)}</ul></GlassCard>}
          {summary.warnings.length > 0 && <GlassCard><p className="mb-2 text-xs font-medium text-white/50">Warnings</p><ul className="space-y-1">{summary.warnings.map((w, i) => <li key={i} className="flex items-start gap-2 text-sm text-yellow-300/90"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{w}</li>)}</ul></GlassCard>}
          {summary.nextActions.length > 0 && <GlassCard><p className="mb-2 text-xs font-medium text-white/50">Next Actions</p><ul className="space-y-1">{summary.nextActions.map((a, i) => <li key={i} className="flex items-start gap-2 text-sm text-white/80"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" />{a}</li>)}</ul></GlassCard>}
          {summary.patientFriendly && <GlassCard><p className="mb-2 text-xs font-medium text-white/50">Patient-Friendly Explanation</p><p className="text-sm text-white/70">{summary.patientFriendly}</p></GlassCard>}
          {summary.doctorSummary && <GlassCard><p className="mb-2 text-xs font-medium text-white/50">Doctor Summary</p><p className="text-sm text-white/70 font-mono">{summary.doctorSummary}</p></GlassCard>}
        </>
      )}
    </div>
  );
}
