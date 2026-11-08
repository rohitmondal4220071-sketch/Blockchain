import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strict grayscale palette (Requirement 2.1) — all HSL saturation 0%
        grayscale: {
          white: "hsl(0 0% 100%)",
          90: "hsl(0 0% 90%)",
          70: "hsl(0 0% 70%)",
          50: "hsl(0 0% 50%)",
          20: "hsl(0 0% 20%)",
          10: "hsl(0 0% 10%)",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
