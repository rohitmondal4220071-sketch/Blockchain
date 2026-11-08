import { Poppins, Source_Serif_4 } from "next/font/google";

// Poppins for display + body (weights 400 and 500). Requirements 3.1, 3.3, 3.4, 3.7.
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-poppins",
  fallback: ["system-ui", "sans-serif"],
});

// Source Serif 4 for elegant italic emphasis. Requirements 3.2, 3.5, 3.8.
export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic", "normal"],
  display: "swap",
  variable: "--font-source-serif",
  fallback: ["Georgia", "serif"],
});
