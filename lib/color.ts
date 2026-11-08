// Grayscale color and text-tier validation (Requirements 2.1–2.4).

import { TEXT_OPACITY_TIERS } from "./config";

/**
 * Parses a color expressed as hsl(), rgb(), or hex into its HSL saturation
 * percentage (0–100). Returns 0 for unparseable input so unknown values are
 * treated conservatively as grayscale-neutral.
 */
export function hslSaturation(color: string): number {
  const value = color.trim().toLowerCase();

  // hsl(H S% L%) or hsl(H, S%, L%)
  const hslMatch = value.match(
    /^hsla?\(\s*[\d.]+(?:deg)?\s*[,\s]\s*([\d.]+)%/
  );
  if (hslMatch) {
    return clampPercent(parseFloat(hslMatch[1]));
  }

  // rgb(r, g, b) / rgba(...)
  const rgbMatch = value.match(
    /^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)/
  );
  if (rgbMatch) {
    return saturationFromRgb(
      parseFloat(rgbMatch[1]),
      parseFloat(rgbMatch[2]),
      parseFloat(rgbMatch[3])
    );
  }

  // hex (#rgb / #rrggbb)
  const hex = value.replace(/^#/, "");
  if (/^[0-9a-f]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return saturationFromRgb(r, g, b);
  }
  if (/^[0-9a-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return saturationFromRgb(r, g, b);
  }

  return 0;
}

/** True iff the color's HSL saturation equals 0%. */
export function isGrayscale(color: string): boolean {
  return hslSaturation(color) === 0;
}

/** True iff the token is one of the four allowed text-opacity tiers. */
export function isAllowedTextTier(token: string): boolean {
  return (TEXT_OPACITY_TIERS as readonly string[]).includes(token);
}

function saturationFromRgb(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  if (delta === 0) return 0;
  const l = (max + min) / 2;
  const s = delta / (1 - Math.abs(2 * l - 1));
  return clampPercent(s * 100);
}

function clampPercent(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}
