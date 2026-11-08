"use client";

import { useEffect, useState } from "react";
import { Activity, Flame, Footprints, Heart, Minus, Moon, TrendingDown, TrendingUp } from "lucide-react";
import { storageService, type HealthStat } from "@/lib/storage";
import { BarChart, GlassCard, GlassInput, SectionTitle } from "./ui";

const todayKey = () => new Date().toISOString().split("T")[0];

export function HealthStats() {
  const [stats, setStats] = useState<HealthStat[]>([]);
  const [today, setToday] = useState<HealthStat>({
    date: todayKey(),
    heartRate: 72,
    steps: 4500,
    sleepHours: 7,
    calories: 1800,
  });

  useEffect(() => {
    const saved = storageService.getHealthStats();
    if (saved.length > 0) {
      setStats(saved);
      const t = saved.find((s) => s.date === todayKey());
      if (t) setToday(t);
    }
  }, []);

  const update = (field: keyof HealthStat, value: number) => {
    const updated = { ...today, [field]: value };
    setToday(updated);
    storageService.updateHealthStat(updated);
    setStats((prev) => {
      const others = prev.filter((s) => s.date !== updated.date);
      return [...others, updated];
    });
  };

  const cards = [
    { label: "Heart Rate", value: today.heartRate || 0, unit: "bpm", Icon: Heart, field: "heartRate" as const, min: 40, max: 200, step: 1 },
    { label: "Steps", value: today.steps || 0, unit: "steps", Icon: Footprints, field: "steps" as const, min: 0, max: 50000, step: 100 },
    { label: "Sleep", value: today.sleepHours || 0, unit: "hours", Icon: Moon, field: "sleepHours" as const, min: 0, max: 24, step: 0.5 },
    { label: "Calories", value: today.calories || 0, unit: "kcal", Icon: Flame, field: "calories" as const, min: 0, max: 5000, step: 50 },
  ];

  const trendFor = (field: keyof HealthStat) => {
    const t = stats.find((s) => s.date === todayKey());
    const y = stats.find((s) => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return s.date === d.toISOString().split("T")[0];
    });
    if (!t || !y || !t[field] || !y[field]) return null;
    const tv = t[field] as number;
    const yv = y[field] as number;
    const diff = ((tv - yv) / yv) * 100;
    if (Math.abs(diff) < 5) return { dir: "stable" as const, value: diff };
    return { dir: diff > 0 ? ("up" as const) : ("down" as const), value: diff };
  };

  const weekly = (field: keyof HealthStat, max: number) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const out: { label: string; value: number; max: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const stat = stats.find((s) => s.date === d.toISOString().split("T")[0]);
      out.push({ label: days[d.getDay()], value: (stat?.[field] as number) || 0, max });
    }
    return out;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const trend = trendFor(c.field);
          const TrendIcon = trend?.dir === "up" ? TrendingUp : trend?.dir === "down" ? TrendingDown : Minus;
          return (
            <div key={c.field} className="liquid-glass rounded-[1.25rem] p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <c.Icon className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                {trend && (
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <TrendIcon className="h-3 w-3" />
                    {Math.abs(trend.value).toFixed(0)}%
                  </div>
                )}
              </div>
              <p className="mb-1 text-xs text-white/50">{c.label}</p>
              <p className="text-2xl font-medium text-white">
                {c.value.toLocaleString()}
                <span className="ml-1 text-sm font-normal text-white/50">{c.unit}</span>
              </p>
            </div>
          );
        })}
      </div>

      <GlassCard>
        <SectionTitle icon={<Activity className="h-5 w-5 text-white" strokeWidth={1.5} />}>
          Update Today&apos;s Stats
        </SectionTitle>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.field} className="space-y-2">
              <label className="text-xs text-white/50">{c.label}</label>
              <GlassInput
                type="number"
                value={c.value}
                min={c.min}
                max={c.max}
                step={c.step}
                onChange={(e) => update(c.field, Number(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h3 className="mb-4 text-base font-medium text-white">Weekly Steps</h3>
          <BarChart data={weekly("steps", 10000)} unitDivisor={1} unitSuffix="" />
        </GlassCard>
        <GlassCard>
          <h3 className="mb-4 text-base font-medium text-white">Weekly Sleep</h3>
          <BarChart data={weekly("sleepHours", 10)} unitDivisor={1} unitSuffix="h" />
        </GlassCard>
      </div>
    </div>
  );
}
