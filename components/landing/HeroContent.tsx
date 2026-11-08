"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CONFIG } from "@/lib/config";
import { FeaturePills } from "./FeaturePills";

interface HeroContentProps {
  onPrimaryAction: (el: HTMLElement | null) => void;
  onFeatureAction: (label: string, el: HTMLElement | null) => void;
}

/**
 * Hero headline (with serif-italic emphasis), supporting text, primary CTA,
 * and feature pills. Requirements 3.5, 7.1–7.10, 8.x, 12.2, 13.2, 15.2.
 */
export function HeroContent({
  onPrimaryAction,
  onFeatureAction,
}: HeroContentProps) {
  const reduceMotion = useReducedMotion();

  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: reduceMotion ? 0 : 0.12, delayChildren: 0.1 }}
      className="flex flex-col items-center gap-7 text-center"
    >
      {/* Headline */}
      <motion.h1
        variants={item}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-3xl text-4xl font-medium leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl"
      >
        Reinventing the{" "}
        <span className="font-serif italic text-white">future</span> of{" "}
        <span className="font-serif italic text-white">intelligent</span>{" "}
        healthcare.
        <span className="mt-3 block text-2xl text-white/80 sm:text-3xl lg:text-4xl">
          Where AI meets{" "}
          <span className="font-serif italic">precision</span> diagnosis.
        </span>
      </motion.h1>

      {/* Supporting text */}
      <motion.p
        variants={item}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-xl text-base leading-relaxed text-white/70"
      >
        {CONFIG.supportingText}
      </motion.p>

      {/* Primary CTA */}
      <motion.div variants={item} transition={{ duration: 0.6, ease: "easeOut" }}>
        <motion.button
          type="button"
          aria-label={CONFIG.ctaLabel}
          onClick={(e) => onPrimaryAction(e.currentTarget)}
          whileHover={reduceMotion ? undefined : { scale: 1.04 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          className="liquid-glass-strong group flex items-center gap-3 rounded-full py-3 pl-7 pr-3 text-base font-medium text-white outline-none transition-colors duration-300 hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {CONFIG.ctaLabel}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </motion.button>
      </motion.div>

      {/* Feature pills */}
      <motion.div variants={item} transition={{ duration: 0.6, ease: "easeOut" }}>
        <FeaturePills onActivate={onFeatureAction} />
      </motion.div>
    </motion.div>
  );
}
