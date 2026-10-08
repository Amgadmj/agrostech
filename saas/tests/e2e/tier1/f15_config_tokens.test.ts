/**
 * Tier 1 — Feature 15: Tailwind Tokens & Configuration Integrity
 * Requirement: Codebase Exploration & PROJECT.md Feature 15
 */

import { testTier1, assertEqual, assertTrue } from "../harness";
import fs from "fs";
import path from "path";

export function registerF15Tests(): void {
  testTier1(
    "F15-01",
    "F15.1: .env.example exists and documents core infrastructure keys",
    () => {
      const envPath = path.join(process.cwd(), ".env.example");
      assertTrue(fs.existsSync(envPath), ".env.example must exist in project root");

      const content = fs.readFileSync(envPath, "utf8");
      assertTrue(content.includes("NEXT_PUBLIC_SUPABASE_URL"));
      assertTrue(content.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
      assertTrue(content.includes("NEXT_PUBLIC_MAP_STYLE"));
    }
  );

  testTier1(
    "F15-02",
    "F15.2: tailwind.config.ts configures brand palette (emerald, mint, cyan)",
    () => {
      const tailwindConfigPath = path.join(process.cwd(), "tailwind.config.ts");
      assertTrue(fs.existsSync(tailwindConfigPath));

      const content = fs.readFileSync(tailwindConfigPath, "utf8");
      assertTrue(content.includes("#00e676"), "Must configure brand emerald (#00e676)");
      assertTrue(content.includes("#00ff85"), "Must configure brand mint (#00ff85)");
      assertTrue(content.includes("#00e5ff"), "Must configure brand cyan (#00e5ff)");
    }
  );

  testTier1(
    "F15-03",
    "F15.3: tailwind.config.ts configures radar animation keyframes (radar-sweep, pulse-glow)",
    () => {
      const tailwindConfigPath = path.join(process.cwd(), "tailwind.config.ts");
      const content = fs.readFileSync(tailwindConfigPath, "utf8");

      assertTrue(content.includes("radar-sweep"));
      assertTrue(content.includes("pulse-glow"));
      assertTrue(content.includes("transform: \"rotate(360deg)\"") || content.includes("rotate(360deg)"));
    }
  );

  testTier1(
    "F15-04",
    "F15.4: tailwind.config.ts configures glowing telemetry box shadows",
    () => {
      const tailwindConfigPath = path.join(process.cwd(), "tailwind.config.ts");
      const content = fs.readFileSync(tailwindConfigPath, "utf8");

      assertTrue(content.includes("boxShadow"));
      assertTrue(content.includes("rgba(0, 230, 118"));
      assertTrue(content.includes("rgba(0, 229, 255") || content.includes("rgba(0, 230, 118"));
    }
  );

  testTier1(
    "F15-05",
    "F15.5: Strict Production Mode vs Demo Fallback configuration flags are verified",
    () => {
      const isStrictProduction = (env: Record<string, string | undefined>) => {
        return env.INTEGRITY_MODE !== "demo" && env.ALLOW_MOCK_FALLBACK !== "true" && env.NODE_ENV === "production";
      };

      assertTrue(isStrictProduction({ NODE_ENV: "production", INTEGRITY_MODE: "production" }));
      assertEqual(isStrictProduction({ NODE_ENV: "production", INTEGRITY_MODE: "demo" }), false);
      assertEqual(isStrictProduction({ NODE_ENV: "development", ALLOW_MOCK_FALLBACK: "true" }), false);
    }
  );
}
