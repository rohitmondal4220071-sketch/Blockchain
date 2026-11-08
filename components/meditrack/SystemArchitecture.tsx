"use client";

import { Activity, BrainCircuit, Cloud, Database, Layout, Monitor, Shield, Workflow } from "lucide-react";
import { GlassCard, SectionTitle } from "./ui";

const FLOW_STEPS = [
  { label: "Patient Upload", desc: "Records, prescriptions, X-rays, lab reports", icon: Monitor },
  { label: "AI Analysis", desc: "Claude Opus 4.8 via OpenRouter", icon: BrainCircuit },
  { label: "Doctor Review", desc: "Verified results & recommendations", icon: Shield },
  { label: "Follow-Up", desc: "Reminders, tracking, analytics", icon: Activity },
];

const ARCHITECTURE = [
  { title: "Frontend", desc: "Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion", icon: Layout },
  { title: "AI Engine", desc: "Claude Opus 4.8 (Anthropic) via OpenRouter API — server-side only", icon: BrainCircuit },
  { title: "Authentication", desc: "Firebase Auth (Email/Password + Google OAuth)", icon: Shield },
  { title: "Data Layer", desc: "localStorage (offline-first), Firebase Firestore (optional)", icon: Database },
  { title: "Background", desc: "Earth/space cinematic gradient + deferred video", icon: Cloud },
  { title: "Dashboard", desc: "Lazy-loaded modules via next/dynamic, liquid glass UI", icon: Workflow },
];

export function SystemArchitecture() {
  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><Workflow className="h-6 w-6 text-white" strokeWidth={1.5} /></div>
          <div><h2 className="text-lg font-medium text-white">System Architecture</h2><p className="mt-1 text-sm text-white/60">Application workflow, AI pipeline, and technology stack overview.</p></div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle icon={<Activity className="h-5 w-5 text-white" strokeWidth={1.5} />}>Patient Workflow</SectionTitle>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3 sm:flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><step.icon className="h-6 w-6 text-white" strokeWidth={1.5} /></div>
                <p className="text-xs font-medium text-white">{step.label}</p>
                <p className="text-[10px] text-white/50 text-center">{step.desc}</p>
              </div>
              {i < FLOW_STEPS.length - 1 && <div className="hidden h-0.5 flex-1 bg-white/15 sm:block" />}
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle icon={<Layout className="h-5 w-5 text-white" strokeWidth={1.5} />}>Technology Stack</SectionTitle>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ARCHITECTURE.map(a => (
            <div key={a.title} className="rounded-xl bg-white/5 p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"><a.icon className="h-5 w-5 text-white" strokeWidth={1.5} /></div>
              <p className="text-sm font-medium text-white">{a.title}</p>
              <p className="mt-1 text-xs text-white/50">{a.desc}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle icon={<BrainCircuit className="h-5 w-5 text-white" strokeWidth={1.5} />}>AI Pipeline</SectionTitle>
        <div className="mt-4 space-y-2 text-sm text-white/70">
          <p>1. User uploads image/text from the dashboard (client-side).</p>
          <p>2. Frontend sends base64 data to server-side API route (app/api/*).</p>
          <p>3. Server calls Claude Opus 4.8 via OpenRouter (API key never exposed).</p>
          <p>4. Model returns structured JSON (prescription data, body part, health advice).</p>
          <p>5. Client normalizes/validates the response and renders results.</p>
          <p>6. If AI is unavailable, features show honest error messages (no fabricated data).</p>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle icon={<Shield className="h-5 w-5 text-white" strokeWidth={1.5} />}>Security & Privacy</SectionTitle>
        <div className="mt-4 space-y-2 text-sm text-white/70">
          <p>• API keys are server-side only (never in NEXT_PUBLIC_ vars).</p>
          <p>• Firebase Auth handles session management securely.</p>
          <p>• Patient data stored locally (localStorage) — no external data sharing.</p>
          <p>• All AI features include medical disclaimers.</p>
          <p>• Role-based access controls protect sensitive sections.</p>
        </div>
      </GlassCard>
    </div>
  );
}
