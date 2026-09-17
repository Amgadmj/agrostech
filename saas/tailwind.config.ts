import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505", // --dark-void
        surface: {
          DEFAULT: "#0a0d10",   // --dark-panel
          hover: "#12171e",
          border: "#1f242b",    // --card-border
          muted: "#0d1117",
        },
        brand: {
          emerald: "#00e676",   // --radar-emerald
          mint: "#00ff85",      // --telemetry-mint
          cyan: "#00e5ff",      // --orbital-cyan
          dark: "#032814",
          glow: "rgba(0, 230, 118, 0.25)",
        },
        slate: {
          muted: "#94a3b8",     // --muted-slate
          tech: "#64748b",      // --tech-gray
        },
        status: {
          regular: "#00e676",   // Radar Emerald
          app: "#00e5ff",       // Orbital Cyan
          reserve: "#00ff85",   // Telemetry Mint
          warning: "#f59e0b",   // Alert Amber
          embargo: "#ef4444",   // Hazard Red
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "Space Mono", "IBM Plex Mono", "monospace"],
        sans: ["var(--font-sans)", "Inter", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "Inter", "sans-serif"],
      },
      keyframes: {
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.05)" },
        },
      },
      animation: {
        "radar-sweep": "radar-sweep 3s linear infinite",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      boxShadow: {
        "emerald": "0 0 15px rgba(0, 230, 118, 0.35)",
        "emerald-lg": "0 0 25px rgba(0, 230, 118, 0.55)",
        "cyan": "0 0 15px rgba(0, 229, 255, 0.35)",
        "embargo": "0 0 15px rgba(239, 68, 68, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
