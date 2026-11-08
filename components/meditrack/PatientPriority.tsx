"use client";

import { useState } from "react";
import { AlertTriangle, Heart, Activity, Wind, Brain, Siren } from "lucide-react";
import { GlassButton, GlassCard, GlassInput, SectionTitle } from "./ui";

type Priority = "critical" | "high" | "medium" | "low";
const PRIORITY_LABEL: Record<Priority, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
const PRIORITY_COLOR: Record<Priority, string> = { critical: "text-red-400", high: "text-orange-400", medium: "text-yellow-400", low: "text-green-400" };
const PRIORITY_BG: Record<Priority, string> = { critical: "bg-red-500/15", high: "bg-orange-500/15", medium: "bg-yellow-500/15", low: "bg-green-500/15" };

function calculatePriority(hr: number, o2: number, bp: string, consciousness: string): { priority: Priority; score: number; action: string } {
  let score = 0;
  if (hr > 150 || hr < 40) score += 40; else if (hr > 120 || hr < 50) score += 25; else if (hr > 100) score += 10;
  if (o2 < 88) score += 40; else if (o2 < 92) score += 30; else if (o2 < 95) score += 15;
  const systolic = parseInt(bp.split("/")[0]) || 120;
  if (systolic > 180 || systolic < 80) score += 30; else if (systolic > 160 || systolic < 90) score += 15;
  const c = consciousness.toLowerCase();
  if (c.includes("unresponsive") || c.includes("unconscious")) score += 40;
  else if (c.includes("confused") || c.includes("drowsy")) score += 20;

  let priority: Priority; let action: string;
  if (score >= 60) { priority = "critical"; action = "Immediate emergency intervention required. Call emergency services."; }
  else if (score >= 40) { priority = "high"; action = "Urgent medical attention needed within 15 minutes."; }
  else if (score >= 20) { priority = "medium"; action = "Medical evaluation recommended within 1-2 hours."; }
  else { priority = "low"; action = "Stable. Routine assessment appropriate."; }
  return { priority, score: Math.min(100, score), action };
}

export function PatientPriority() {
  const [form, setForm] = useState({ symptoms: "", heartRate: "", oxygenLevel: "", bloodPressure: "", consciousness: "Alert" });
  const [result, setResult] = useState<{ priority: Priority; score: number; action: string } | null>(null);

  const assess = () => {
    const hr = Number(form.heartRate) || 80;
    const o2 = Number(form.oxygenLevel) || 98;
    setResult(calculatePriority(hr, o2, form.bloodPressure || "120/80", form.consciousness));
  };

  const reset = () => { setForm({ symptoms: "", heartRate: "", oxygenLevel: "", bloodPressure: "", consciousness: "Alert" }); setResult(null); };

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15"><Siren className="h-6 w-6 text-red-400" strokeWidth={1.5} /></div>
          <div><h2 className="text-lg font-medium text-white">Patient Priority Engine</h2><p className="mt-1 text-sm text-white/60">Calculate risk score and priority level from patient vitals.</p></div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle icon={<Heart className="h-5 w-5 text-white" strokeWidth={1.5} />}>Vital Signs Input</SectionTitle>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <GlassInput placeholder="Symptoms" value={form.symptoms} onChange={e => setForm({ ...form, symptoms: e.target.value })} />
          <GlassInput placeholder="Heart Rate (bpm)" type="number" value={form.heartRate} onChange={e => setForm({ ...form, heartRate: e.target.value })} />
          <GlassInput placeholder="Oxygen Level (%)" type="number" value={form.oxygenLevel} onChange={e => setForm({ ...form, oxygenLevel: e.target.value })} />
          <GlassInput placeholder="Blood Pressure (e.g., 120/80)" value={form.bloodPressure} onChange={e => setForm({ ...form, bloodPressure: e.target.value })} />
          <GlassInput placeholder="Consciousness (Alert/Confused/Unresponsive)" value={form.consciousness} onChange={e => setForm({ ...form, consciousness: e.target.value })} />
        </div>
        <div className="mt-4 flex gap-2">
          <GlassButton onClick={assess}>Calculate Priority</GlassButton>
          {result && <GlassButton variant="ghost" onClick={reset}>Reset</GlassButton>}
        </div>
      </GlassCard>

      {result && (
        <GlassCard className={`ring-1 ${result.priority === "critical" ? "ring-red-500/40 animate-pulse" : result.priority === "high" ? "ring-orange-500/30" : "ring-white/10"}`}>
          <div className="text-center">
            <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${PRIORITY_BG[result.priority]}`}>
              <span className={`text-3xl font-medium ${PRIORITY_COLOR[result.priority]}`}>{result.score}</span>
            </div>
            <p className={`text-xl font-medium ${PRIORITY_COLOR[result.priority]}`}>{PRIORITY_LABEL[result.priority]} Priority</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full transition-all duration-700 ${result.priority === "critical" ? "bg-red-500" : result.priority === "high" ? "bg-orange-500" : result.priority === "medium" ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${result.score}%` }} />
            </div>
            <p className="mt-4 text-sm text-white/70">{result.action}</p>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([["critical", "Immediate"], ["high", "< 15 min"], ["medium", "1-2 hours"], ["low", "Routine"]] as [Priority, string][]).map(([p, time]) => (
          <div key={p} className={`rounded-xl p-4 ${PRIORITY_BG[p]}`}>
            <p className={`text-sm font-medium capitalize ${PRIORITY_COLOR[p]}`}>{p}</p>
            <p className="text-xs text-white/50">Response: {time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
