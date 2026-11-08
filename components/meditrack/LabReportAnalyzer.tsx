"use client";

import { useRef, useState } from "react";
import { AlertTriangle, FileText, Loader2, Send, TestTube, Upload, X } from "lucide-react";
import { extractTextFromImage } from "@/lib/ocr/tesseract";
import { validateLabReport } from "@/lib/ocr/validate";
import { GlassButton, GlassCard, SectionTitle } from "./ui";

interface LabResult {
  parameter: string;
  value: string;
  normalRange: string;
  status: "normal" | "low" | "high";
}

interface LabAnalysis {
  results: LabResult[];
  explanation: string;
  abnormalFindings: string[];
  recommendations: string;
}

const STATUS_COLOR = { normal: "text-green-400", low: "text-yellow-400", high: "text-red-400" };
const STATUS_BG = { normal: "bg-green-500/15", low: "bg-yellow-500/15", high: "bg-red-500/15" };

const STORAGE_KEY = "mediscan_lab_reports";
function loadHistory(): LabAnalysis[] { if (typeof window === "undefined") return []; try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function saveHistory(h: LabAnalysis[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, 20))); }

export function LabReportAnalyzer() {
  const [file, setFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<LabAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"ai" | "rejected" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null); setAnalysis(null); setMode(null);
    const reader = new FileReader();
    reader.onloadend = () => setFile(reader.result as string);
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError(null); setMode(null);
    try {
      // Step 1: OCR extraction.
      const ocrText = await extractTextFromImage(file);

      // Step 2: Validate OCR text — reject if not a lab report.
      const validation = validateLabReport(ocrText);
      if (!validation.isValid) {
        setError(validation.reason || "Invalid upload.");
        setMode("rejected");
        setLoading(false);
        return;
      }

      // Step 3: Send validated OCR text to AI route.
      const res = await fetch("/api/lab-report-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText }),
      });
      const data = (await res.json()) as { available: boolean; raw?: string };

      if (data.available && data.raw) {
        let cleaned = data.raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
        const first = cleaned.indexOf("{");
        const last = cleaned.lastIndexOf("}");
        if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
        try {
          const parsed = JSON.parse(cleaned);
          // If AI says it's not a lab report, reject.
          if (parsed.isLabReport === false) {
            setError("The AI could not identify this as a valid lab report. Please upload a clear blood test or laboratory report.");
            setMode("rejected");
            setLoading(false);
            return;
          }
          const result: LabAnalysis = {
            results: Array.isArray(parsed.results || parsed.values) ? (parsed.results || parsed.values) : [],
            explanation: parsed.explanation || parsed.summary || "Analysis complete.",
            abnormalFindings: Array.isArray(parsed.abnormalFindings) ? parsed.abnormalFindings : [],
            recommendations: parsed.recommendations || parsed.recommendedFollowUp?.join(". ") || "Consult your doctor.",
          };
          if (result.results.length === 0) {
            setError("No lab values could be extracted from this image. Please upload a clearer lab report.");
            setMode("rejected");
            setLoading(false);
            return;
          }
          setAnalysis(result); setMode("ai");
          saveHistory([result, ...loadHistory()]);
        } catch {
          setError("Could not parse the AI response. Please try again with a clearer image.");
          setMode("rejected");
        }
      } else {
        setError("AI analysis unavailable (API key may be missing or expired). Please configure your OpenRouter keys.");
        setMode("rejected");
      }
    } catch { setError("Failed to analyze. Check your connection."); setMode("rejected"); }
    finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setAnalysis(null); setError(null); setMode(null); if (fileRef.current) fileRef.current.value = ""; };

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><TestTube className="h-6 w-6 text-white" strokeWidth={1.5} /></div>
          <div><h2 className="text-lg font-medium text-white">Lab Report Analyzer</h2><p className="mt-1 text-sm text-white/60">Upload blood tests or lab results for AI-powered interpretation using OCR + GPT 5.4.</p></div>
        </div>
      </GlassCard>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/15">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
          <div>
            <p className="text-sm text-white/80">{error}</p>
            {mode === "rejected" && <p className="mt-1 text-xs text-white/50">Upload rejected — no sample data shown.</p>}
          </div>
        </div>
      )}

      {!file && (
        <GlassCard>
          <div className="rounded-xl border-2 border-dashed border-white/15 p-8 text-center hover:border-white/30 transition">
            <TestTube className="mx-auto mb-4 h-12 w-12 text-white/50" strokeWidth={1.25} />
            <p className="mb-2 font-medium text-white">Upload Lab Report</p>
            <p className="mb-6 text-sm text-white/50">PNG, JPG, WEBP, or PDF</p>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleUpload} className="hidden" />
            <GlassButton onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Choose File</GlassButton>
          </div>
        </GlassCard>
      )}

      {file && !analysis && !error && (
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-medium text-white">Preview</h3>
            <button onClick={reset} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80 hover:bg-white/15 transition"><X className="h-4 w-4" /> Cancel</button>
          </div>
          <div className="mb-4 flex justify-center rounded-xl bg-white/5 p-2 max-h-[300px] overflow-hidden">
            {file.includes("pdf") ? <FileText className="h-16 w-16 text-white/50" /> : <img src={file} alt="Lab report" className="max-h-[280px] object-contain rounded-lg" />}
          </div>
          <GlassButton onClick={analyze} disabled={loading} className="w-full justify-center">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing (OCR + AI)…</> : <><Send className="h-4 w-4" /> Analyze Report</>}
          </GlassButton>
        </GlassCard>
      )}

      {file && error && (
        <GlassCard>
          <GlassButton onClick={reset} className="w-full justify-center"><X className="h-4 w-4" /> Reset & Try Another</GlassButton>
        </GlassCard>
      )}

      {analysis && (
        <>
          <GlassCard>
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle icon={<TestTube className="h-5 w-5 text-white" strokeWidth={1.5} />}>Lab Values</SectionTitle>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">AI Mode</span>
                <button onClick={reset} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80 hover:bg-white/15 transition"><X className="h-4 w-4" /> New Report</button>
              </div>
            </div>
            <div className="space-y-2">
              {analysis.results.map((r, i) => (
                <div key={`${r.parameter}-${i}`} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                  <div><p className="text-sm font-medium text-white">{r.parameter}</p><p className="text-xs text-white/50">Normal: {r.normalRange}</p></div>
                  <div className="text-right"><p className="text-sm font-medium text-white">{r.value}</p><span className={`text-xs font-medium capitalize ${STATUS_COLOR[r.status] || "text-white/60"} ${STATUS_BG[r.status] || "bg-white/10"} rounded-full px-2 py-0.5`}>{r.status}</span></div>
                </div>
              ))}
            </div>
          </GlassCard>

          {analysis.abnormalFindings.length > 0 && (
            <GlassCard>
              <SectionTitle icon={<AlertTriangle className="h-5 w-5 text-yellow-400" strokeWidth={1.5} />}>Abnormal Findings</SectionTitle>
              <ul className="mt-3 space-y-2">{analysis.abnormalFindings.map((f, i) => <li key={i} className="flex items-start gap-2 text-sm text-white/80"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />{f}</li>)}</ul>
            </GlassCard>
          )}

          <GlassCard>
            <SectionTitle icon={<FileText className="h-5 w-5 text-white" strokeWidth={1.5} />}>AI Explanation</SectionTitle>
            <p className="mt-3 whitespace-pre-wrap text-sm text-white/70">{analysis.explanation}</p>
          </GlassCard>

          <GlassCard>
            <p className="text-xs text-white/50">Recommendations</p>
            <p className="mt-1 text-sm text-white/80">{analysis.recommendations}</p>
          </GlassCard>

          <div className="flex items-start gap-3 rounded-xl bg-white/5 p-4"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-white/70" /><p className="text-xs text-white/60">This is not a medical diagnosis. Always consult a qualified healthcare professional for interpretation of lab results.</p></div>
        </>
      )}
    </div>
  );
}
