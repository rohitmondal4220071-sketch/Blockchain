"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface HeroPanelProps {
  children: ReactNode;
}

/**
 * Centered floating liquid-glass hero panel. ~70% width on desktop, stacked
 * with reduced padding on mobile. Requirements 5.1–5.8, 12.1, 12.5, 14.x.
 */
export function HeroPanel({ children }: HeroPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={{ opacity: 0, y: reduceMotion ? 0 : 30, scale: reduceMotion ? 1 : 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="liquid-glass-strong relative flex w-[92%] max-w-6xl flex-col gap-10 rounded-[3rem] p-6 sm:w-[85%] sm:p-10 md:w-[72%] lg:gap-14 lg:p-16"
      style={
        reduceMotion
          ? undefined
          : { animation: "floaty 8s ease-in-out infinite" }
      }
    >
      {children}
    </motion.section>
  );
}
