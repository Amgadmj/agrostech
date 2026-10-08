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
        background: "rgb(var(--bg-page-rgb) / <alpha-value>)",
        foreground: "rgb(var(--text-primary-rgb) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--bg-surface-rgb) / <alpha-value>)",
          hover: "rgb(var(--bg-surface-elevated-rgb) / <alpha-value>)",
          border: "rgb(var(--border-subtle-rgb) / <alpha-value>)",
          muted: "rgb(var(--bg-surface-elevated-rgb) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "rgb(var(--brand-primary-rgb) / <alpha-value>)",
          primary: "rgb(var(--brand-primary-rgb) / <alpha-value>)",
          accent: "rgb(var(--brand-accent-rgb) / <alpha-value>)",
          emerald: "#00e676",   // --radar-emerald
          mint: "#00ff85",      // --telemetry-mint
          neon: "#00ff85",      // --brand-neon
          lime: "rgb(var(--brand-lime-rgb) / <alpha-value>)", // fix undefined text-brand-lime
          cyan: "#00e5ff",      // --orbital-cyan
          dark: "#032814",
          glow: "rgba(0, 230, 118, 0.25)",
        },
        slate: {
          muted: "rgb(var(--text-muted-rgb) / <alpha-value>)",
          tech: "rgb(var(--text-secondary-rgb) / <alpha-value>)",
        },
        status: {
          regular: "rgb(var(--status-success-rgb) / <alpha-value>)",
          app: "#00e5ff",       // Orbital Cyan
          reserve: "#00ff85",   // Telemetry Mint
          warning: "rgb(var(--status-warning-rgb) / <alpha-value>)",
          embargo: "rgb(var(--status-critical-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "IBM Plex Mono", "JetBrains Mono", "Space Mono", "monospace"],
        sans: ["var(--font-sans)", "Inter", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "Bricolage Grotesque", "Space Grotesk", "Inter", "sans-serif"],
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
        "neon": "0 0 15px rgba(0, 255, 133, 0.4)",
        "neon-lg": "0 0 25px rgba(0, 255, 133, 0.6)",
        "embargo": "0 0 15px rgba(239, 68, 68, 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
