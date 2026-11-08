"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/** Shared grayscale liquid-glass primitives for the MediScan dashboard features. */

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`liquid-glass rounded-[1.5rem] p-5 ${className}`}>{children}</div>
  );
}

export function SectionTitle({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-base font-medium text-white">
      {icon}
      {children}
    </h3>
  );
}

export function GlassButton({
  children,
  className = "",
  variant = "solid",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-white/40 active:scale-95 disabled:opacity-50";
  const styles =
    variant === "solid"
      ? "liquid-glass glass-glow text-white"
      : "text-white/70 hover:bg-white/10 hover:text-white";
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function GlassInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:bg-white/10 focus:ring-2 focus:ring-white/30 disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function StatTile({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="liquid-glass rounded-[1.25rem] p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
        {icon}
      </div>
      <p className="mb-1 text-xs text-white/50">{label}</p>
      <p className="text-2xl font-medium text-white">
        {value}
        {unit ? (
          <span className="ml-1 text-sm font-normal text-white/50">{unit}</span>
        ) : null}
      </p>
    </div>
  );
}

/** Simple grayscale vertical bar chart used across stats/reports. */
export function BarChart({
  data,
  unitDivisor = 1000,
  unitSuffix = "L",
}: {
  data: { label: string; value: number; max: number }[];
  unitDivisor?: number;
  unitSuffix?: string;
}) {
  return (
    <div className="flex h-40 items-end justify-between gap-2">
      {data.map((d, i) => {
        const pct = d.max > 0 ? Math.min((d.value / d.max) * 100, 100) : 0;
        const isLast = i === data.length - 1;
        return (
          <div key={`${d.label}-${i}`} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-28 w-full flex-col justify-end">
              <div
                className={`w-full rounded-t-lg transition-all duration-500 ${
                  isLast ? "bg-white/80" : "bg-white/30"
                }`}
                style={{ height: `${pct}%`, minHeight: d.value > 0 ? "6px" : "0px" }}
              />
            </div>
            <div className="text-center">
              <p className={`text-xs ${isLast ? "text-white" : "text-white/50"}`}>
                {d.label}
              </p>
              <p className="text-[10px] text-white/40">
                {d.value > 0
                  ? `${(d.value / unitDivisor).toFixed(unitDivisor === 1 ? 0 : 1)}${unitSuffix}`
                  : "-"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
