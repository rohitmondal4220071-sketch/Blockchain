"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowRight, Bone, Droplets, Heart, Pill, ScanLine, Sparkles } from "lucide-react";
import { storageService, type UserProfile } from "@/lib/storage";
import { GlassCard } from "./ui";
import { DataExport } from "./DataExport";
import type { DashboardTab } from "./types";

interface DashboardOverviewProps {
  user: UserProfile;
  onNavigate: (tab: DashboardTab) => void;
}

export function DashboardOverview({ user, onNavigate }: DashboardOverviewProps) {
  const [medicineStats, setMedicineStats] = useState({ taken: 0, total: 0, percentage: 0 });
  const [water, setWater] = useState({ amount: 0, goal: 2500 });

  useEffect(() => {
    setMedicineStats(storageService.getMedicationAdherenceStats());
    const today = storageService.getTodayWaterLog();
    if (today) setWater({ amount: today.amount, goal: today.goal });
  }, []);

  const greeting =
    new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening";

  const stats = [
    { label: "Heart Rate", value: "72", unit: "bpm", Icon: Heart },
    { label: "Water Intake", value: (water.amount / 1000).toFixed(1), unit: "L", Icon: Droplets },
    { label: "Active Minutes", value: "45", unit: "min", Icon: Activity },
    { label: "Medications", value: medicineStats.taken.toString(), unit: "taken", Icon: Pill },
  ];

  const quickActions: { label: string; tab: DashboardTab; Icon: typeof Pill }[] = [
    { label: "Add Medicine", tab: "medicine", Icon: Pill },
    { label: "Scan Rx", tab: "scanner", Icon: ScanLine },
    { label: "X-Ray Analyzer", tab: "xray", Icon: Bone },
    { label: "Log Water", tab: "water", Icon: Droplets },
  ];

  const medicines = storageService.getMedicines();
  const reminders = medicines.slice(0, 3).map((med) => ({
    name: med.name,
    time: med.time,
    status: med.taken ? "taken" : "upcoming",
  }));

  return (
    <div className="space-y-6">
      <GlassCard className="liquid-glass-strong">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="mb-2 text-2xl font-medium text-white">
              Good {greeting}, {user.name}
            </h2>
            <p className="text-white/60">You&apos;re doing great! Keep up with your health goals today.</p>
          </div>
          <button
            onClick={() => onNavigate("chat")}
            className="liquid-glass glass-glow inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white outline-none transition focus-visible:ring-2 focus-visible:ring-white/40 active:scale-95"
          >
            <Sparkles className="h-4 w-4" /> Talk to AI Assistant
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="liquid-glass rounded-[1.25rem] p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <s.Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
            <p className="mb-1 text-xs text-white/50">{s.label}</p>
            <p className="text-2xl font-medium text-white">
              {s.value}
              <span className="ml-1 text-sm font-normal text-white/50">{s.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h3 className="mb-3 text-base font-medium text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => onNavigate(a.tab)}
                className="flex items-center gap-3 rounded-xl bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <a.Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-white">{a.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-medium text-white">Today&apos;s Medications</h3>
            <button
              onClick={() => onNavigate("medicine")}
              className="flex items-center gap-1 text-xs text-white/70 transition hover:text-white"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {reminders.length === 0 ? (
              <div className="py-6 text-center text-white/50">
                <Pill className="mx-auto mb-2 h-8 w-8 opacity-50" strokeWidth={1.25} />
                <p className="text-sm">No medications scheduled</p>
              </div>
            ) : (
              reminders.map((r) => (
                <div key={r.name} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                      <Pill className="h-4 w-4 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{r.name}</p>
                      <p className="text-xs text-white/50">{r.time}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-medium capitalize text-white/70">
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="mb-3 flex items-center gap-2 text-base font-medium text-white">
          <Sparkles className="h-4 w-4 text-white" strokeWidth={1.5} /> AI Health Tip
        </h3>
        <p className="text-sm leading-relaxed text-white/60">
          Based on your activity patterns, consider taking a 10-minute walk after lunch. Post-meal
          walks can help regulate blood sugar levels and improve digestion.
          {medicineStats.percentage >= 80
            ? " Great job on your medication adherence! Keep it up."
            : " Try to improve your medication consistency for better health outcomes."}
        </p>
      </GlassCard>

      <DataExport />
    </div>
  );
}
