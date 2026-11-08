"use client";

import Image from "next/image";
import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { CONFIG } from "@/lib/config";

interface BrandHeaderProps {
  identityLabel: string;
  isAuthenticated?: boolean;
  onMenuActivate?: () => void;
  onSignOut?: () => void;
}

/**
 * Brand header: logo + name (top-left), menu control + identity (top-right).
 * Requirements 6.1–6.8, 13.2, 15.2.
 */
export function BrandHeader({
  identityLabel,
  isAuthenticated = false,
  onMenuActivate,
  onSignOut,
}: BrandHeaderProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <header className="flex w-full items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {!logoFailed ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Image
              src="/logo.png"
              alt="MediScan AI logo"
              width={28}
              height={28}
              onError={() => setLogoFailed(true)}
              priority
            />
          </span>
        ) : null}
        <span className="text-2xl font-semibold tracking-tight text-white">
          {CONFIG.brandName}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-white/50 sm:inline" title={identityLabel}>
          {identityLabel}
        </span>

        {isAuthenticated ? (
          <button
            type="button"
            aria-label="Log out"
            onClick={onSignOut}
            className="liquid-glass glass-glow flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 outline-none transition focus-visible:ring-2 focus-visible:ring-white/40 active:scale-95"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        ) : (
          <button
            type="button"
            aria-label="Open menu"
            onClick={onMenuActivate}
            className="liquid-glass glass-glow flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 outline-none transition focus-visible:ring-2 focus-visible:ring-white/40 active:scale-95"
          >
            <Menu className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Menu</span>
          </button>
        )}
      </div>
    </header>
  );
}
