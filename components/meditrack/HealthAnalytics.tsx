"use client";

import { useEffect, useState } from "react";
import { Activity, BarChart3, BrainCircuit, FileText, Heart, ScanLine, TrendingUp, Users } from "lucide-react";
import { storageService } from "@/lib/storage";
import { GlassCard, SectionTitle, StatTile } from "./ui";

export function HealthAnalytics() {
  const [stats, setStats] = useState({ totalPatients: 0, prescriptions: 0, xrayScans: 0, medicines: 0, waterAvg: 0, bmiRecords: 0, criticalCases: 0, followUps: 0 });

  useEffect(() => {
    const prescriptions = storageService.getPrescriptions().length;
    const xrayScans = storageService.getXRayAnalyses().length;
    const medicines = storageService.getMedicines().length;
    const waterStats = storageService.getWeeklyWaterStats();
    const waterAvg = waterStats.length > 0 ? Math.round(waterStats.reduce((s, d) => s + d.amount, 0) / waterStats.length) : 0;
    const bmiRecords = storageService.getBMIRecords().length;
    const profile = storageService.getUserProfile();
    const followUps = typeof window !== "undefined" ? (JSON.parse(localStorage.getItem("mediscan_followup_reminders") || "[]") as unknown[]).length : 0;

    setStats({
      totalPatients: profile ? 1 : 0,
      prescriptions,
      xrayScans,
      medicines,
      waterAvg,
      bmiRecords,
      criticalCases: 0,
      followUps,
    });
  }, []);

  const analyticsCards = [
    { label: "Prescriptions Scanned", value: stats.prescriptions, icon: <FileText className="h-5 w-5 text-white" strokeWidth={1.5} /> },
    { label: "X-Ray Analyses", value: stats.xrayScans, icon: <ScanLine className="h-5 w-5 text-white" strokeWidth={1.5} /> },
    { label: "Medicines Tracked", value: stats.medicines, icon: <Heart className="h-5 w-5 text-white" strokeWidth={1.5} /> },
    { label: "BMI Records", value: stats.bmiRecords, icon: <Activity className="h-5 w-5 text-white" strokeWidth={1.5} /> },
    { label: "Avg Water (ml/day)", value: stats.waterAvg, icon: <TrendingUp className="h-5 w-5 text-white" strokeWidth={1.5} /> },
    { label: "Follow-Up Reminders", value: stats.followUps, icon: <Users className="h-5 w-5 text-white" strokeWidth={1.5} /> },
  ];

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><BarChart3 className="h-6 w-6 text-white" strokeWidth={1.5} /></div>
          <div><h2 className="text-lg font-medium text-white">Health Analytics</h2><p className="mt-1 text-sm text-white/60">Advanced statistics, AI analysis counts, and health trends across all modules.</p></div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {analyticsCards.map(c => <StatTile key={c.label} label={c.label} value={c.value} icon={c.icon} />)}
      </div>

      <GlassCard>
        <SectionTitle icon={<BrainCircuit className="h-5 w-5 text-white" strokeWidth={1.5} />}>AI Usage Summary</SectionTitle>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <p className="text-2xl font-medium text-white">{stats.prescriptions + stats.xrayScans}</p>
            <p className="text-xs text-white/50">Total AI Analyses</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <p className="text-2xl font-medium text-white">{stats.prescriptions}</p>
            <p className="text-xs text-white/50">Prescription Scans</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 text-center">
            <p className="text-2xl font-medium text-white">{stats.xrayScans}</p>
            <p className="text-xs text-white/50">X-Ray Scans</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle icon={<TrendingUp className="h-5 w-5 text-white" strokeWidth={1.5} />}>Platform Utilization</SectionTitle>
        <div className="mt-4 space-y-3">
          {[
            { label: "Medicine Adherence", value: storageService.getMedicationAdherenceStats().percentage },
            { label: "Hydration Goal", value: stats.waterAvg > 0 ? Math.min(100, Math.round((stats.waterAvg / 2500) * 100)) : 0 },
            { label: "Feature Usage", value: Math.min(100, Math.round(((stats.prescriptions + stats.xrayScans + stats.medicines + stats.bmiRecords) / 20) * 100)) },
          ].map(item => (
            <div key={item.label}>
              <div className="mb-1 flex justify-between text-sm"><span className="text-white/60">{item.label}</span><span className="font-medium text-white">{item.value}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white/70 transition-all duration-500" style={{ width: `${item.value}%` }} /></div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
