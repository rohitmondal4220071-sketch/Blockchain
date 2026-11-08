"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Brain, ScanLine, FileText } from "lucide-react";
import { CONFIG } from "@/lib/config";

const PILL_ICONS = [Brain, ScanLine, FileText];

interface FeaturePillsProps {
  onActivate: (label: string, el: HTMLElement | null) => void;
}

/**
 * Three glass feature pills with glow on hover + keyboard focus.
 * Requirements 8.1–8.5, 12.2, 15.2.
 */
export function FeaturePills({ onActivate }: FeaturePillsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {CONFIG.featurePills.map((label, i) => {
        const Icon = PILL_ICONS[i] ?? Brain;
        return (
          <motion.button
            key={label}
            type="button"
            aria-label={label}
            onClick={(e) => onActivate(label, e.currentTarget)}
            whileHover={reduceMotion ? undefined : { scale: 1.05 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className="liquid-glass glass-glow flex items-center gap-2 rounded-full px-4 py-2 text-xs text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}
