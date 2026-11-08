"use client";

import { useEffect, useState } from "react";
import { Droplets, Minus, Plus, Target, TrendingUp } from "lucide-react";
import { storageService } from "@/lib/storage";
import { BarChart, GlassButton, GlassCard, SectionTitle } from "./ui";

const quickAddOptions = [100, 250, 500];

export function WaterIntake() {
  const [intake, setIntake] = useState(0);
  const [goal, setGoal] = useState(2500);
  const [weekly, setWeekly] = useState<{ day: string; amount: number; goal: number }[]>([]);

  useEffect(() => {
    const today = storageService.getTodayWaterLog();
    if (today) {
      setIntake(today.amount);
      setGoal(today.goal);
    }
    setWeekly(storageService.getWeeklyWaterStats());
  }, []);

  const addWater = (amount: number) => {
    const next = Math.max(0, intake + amount);
    setIntake(next);
    storageService.updateWaterLog(next, goal);
    setWeekly(storageService.getWeeklyWaterStats());
  };

  const percentage = Math.min(Math.round((intake / goal) * 100), 100);
  const remaining = Math.max(0, goal - intake);
  const glasses = Math.round(intake / 250);
  const circumference = 2 * Math.PI * 88;

  const statusMessage = () => {
    if (percentage >= 100) return "Amazing! You've reached your daily goal.";
    if (percentage >= 75) return "Almost there! Just a bit more to go.";
    if (percentage >= 50) return "You're halfway there! Keep it up.";
    if (percentage >= 25) return "Good start! Remember to drink regularly.";
    return "Start hydrating! Your body needs water.";
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex flex-col items-center gap-8 lg:flex-row">
          <div className="relative h-48 w-48">
            <svg className="h-full w-full -rotate-90">
              <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - percentage / 100)}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Droplets className="mb-1 h-8 w-8 text-white" strokeWidth={1.5} />
              <p className="text-3xl font-medium text-white">{percentage}%</p>
              <p className="text-sm text-white/50">
                {(intake / 1000).toFixed(1)}L / {(goal / 1000).toFixed(1)}L
              </p>
            </div>
          </div>

          <div className="w-full flex-1">
            <p className="mb-4 text-lg font-medium text-white/80">{statusMessage()}</p>

            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-2xl font-medium text-white">{glasses}</p>
                <p className="text-xs text-white/50">Glasses</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-2xl font-medium text-white">{remaining}</p>
                <p className="text-xs text-white/50">ml remaining</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-2xl font-medium text-white">{goal}</p>
                <p className="text-xs text-white/50">ml goal</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAddOptions.map((amount) => (
                <GlassButton key={amount} onClick={() => addWater(amount)} className="flex-1">
                  <Plus className="h-4 w-4" /> {amount}ml
                </GlassButton>
              ))}
              <GlassButton variant="ghost" onClick={() => addWater(-250)}>
                <Minus className="h-4 w-4" /> Remove
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle icon={<Target className="h-5 w-5 text-white" strokeWidth={1.5} />}>
          Add Custom Amount
        </SectionTitle>
        <div className="mt-4 flex flex-wrap gap-2">
          {[50, 100, 150, 200, 300, 350, 400, 500, 750, 1000].map((amount) => (
            <button
              key={amount}
              onClick={() => addWater(amount)}
              className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
            >
              {amount}ml
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle icon={<TrendingUp className="h-5 w-5 text-white" strokeWidth={1.5} />}>
          Weekly Progress
        </SectionTitle>
        <div className="mt-4">
          <BarChart
            data={weekly.map((d) => ({ label: d.day, value: d.amount, max: d.goal }))}
            unitDivisor={1000}
            unitSuffix="L"
          />
        </div>
      </GlassCard>
    </div>
  );
}
