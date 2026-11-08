import { CONFIG } from "@/lib/config";

/**
 * Bottom quote area: label, mixed-font quote, and author line with decorative
 * rules. Requirements 11.1–11.3, 3.5.
 */
export function BottomQuote() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="text-[0.7rem] font-medium uppercase tracking-[0.4em] text-white/50">
        {CONFIG.quoteLabel}
      </span>

      <p className="max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
        We imagined a world where{" "}
        <span className="font-serif italic text-white">medical intelligence</span>{" "}
        becomes universally accessible.
      </p>

      <div className="mt-1 flex items-center gap-4">
        <span className="h-px w-10 bg-white/30" />
        <span className="text-xs tracking-[0.3em] text-white/50">
          {CONFIG.quoteAuthor}
        </span>
        <span className="h-px w-10 bg-white/30" />
      </div>
    </div>
  );
}
