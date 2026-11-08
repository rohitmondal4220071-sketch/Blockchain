"use client";

import { Loader2 } from "lucide-react";

/**
 * Lightweight liquid-glass skeleton shown while a lazy-loaded feature module
 * is being fetched/parsed. Keeps the dark smoky glass look and avoids a blank
 * screen during code-splitting.
 */
export function FeatureSkeleton({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="space-y-6">
      <div className="liquid-glass flex items-center gap-3 rounded-[1.5rem] p-5">
        <Loader2 className="h-5 w-5 animate-spin text-white/70" strokeWidth={1.75} />
        <span className="text-sm text-white/70">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="liquid-glass h-24 animate-pulse rounded-[1.25rem]" />
        ))}
      </div>
      <div className="liquid-glass h-56 animate-pulse rounded-[1.5rem]" />
    </div>
  );
}

/**
 * Full-screen dashboard boot skeleton: sidebar rail + header + content
 * placeholders, shown immediately after login while the profile resolves.
 */
export function DashboardSkeleton() {
  return (
    <div className="relative z-10 flex min-h-screen">
      {/* Sidebar rail */}
      <aside className="hidden w-64 flex-col p-4 lg:flex">
        <div className="liquid-glass-strong h-full animate-pulse rounded-[2rem]" />
      </aside>

      {/* Main */}
      <main className="relative z-10 flex min-h-screen flex-1 flex-col">
        <header className="px-4 py-4 lg:px-6">
          <div className="liquid-glass flex items-center justify-between rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-white/70" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-medium text-white">Preparing your health dashboard…</p>
                <p className="text-xs text-white/50">Just a moment</p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 space-y-6 p-4 lg:p-6">
          <div className="liquid-glass-strong h-28 animate-pulse rounded-[2rem]" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="liquid-glass h-24 animate-pulse rounded-[1.25rem]" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="liquid-glass h-48 animate-pulse rounded-[1.5rem]" />
            <div className="liquid-glass h-48 animate-pulse rounded-[1.5rem]" />
          </div>
        </div>
      </main>
    </div>
  );
}
