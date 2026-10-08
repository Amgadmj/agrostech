#!/usr/bin/env node
/**
 * Agrostech E2E Automated Test Runner
 *
 * Executes all 4 E2E Test Tiers:
 * - Tier 1: Feature Coverage (F1 to F15) >= 75 tests
 * - Tier 2: Boundary & Corner Cases >= 75 tests
 * - Tier 3: Cross-Feature Interactions >= 15 tests
 * - Tier 4: Real-World Application Scenarios (S1 to S8) >= 8 tests
 *
 * Exit code 0 on all pass, exit code 1 on failure.
 * Executable via: `npx tsx tests/e2e/runner.ts`
 */

import {
  getRegisteredTests,
  clearRegistry,
  TestCase,
  TestResult,
} from "./harness";

// Tier 1 Suites
import { registerF1Tests } from "./tier1/f1_auth.test";
import { registerF2Tests } from "./tier1/f2_sicar_polling.test";
import { registerF3Tests } from "./tier1/f3_boundary_parsing.test";
import { registerF4Tests } from "./tier1/f4_r2c_compliance.test";
import { registerF5Tests } from "./tier1/f5_model_m1.test";
import { registerF6Tests } from "./tier1/f6_bdc_stac.test";
import { registerF7Tests } from "./tier1/f7_backscatter_curves.test";
import { registerF8Tests } from "./tier1/f8_m2_harvest.test";
import { registerF9Tests } from "./tier1/f9_commercial_sar.test";
import { registerF10Tests } from "./tier1/f10_onboarding_wizard.test";
import { registerF11Tests } from "./tier1/f11_scorecard.test";
import { registerF12Tests } from "./tier1/f12_map_visualizer.test";
import { registerF13Tests } from "./tier1/f13_shield_rj.test";
import { registerF14Tests } from "./tier1/f14_mcr29_dossier.test";
import { registerF15Tests } from "./tier1/f15_config_tokens.test";

// Tier 2 Suites
import { registerTier2Part1Tests } from "./tier2/tier2_boundaries_part1.test";
import { registerTier2Part2Tests } from "./tier2/tier2_boundaries_part2.test";

// Tier 3 Suites
import { registerTier3Tests } from "./tier3/tier3_cross_feature.test";

// Tier 4 Suites
import { registerTier4Tests } from "./tier4/tier4_scenarios.test";

function registerAllSuites(): void {
  clearRegistry();

  // Tier 1: Feature Coverage (15 features)
  registerF1Tests();
  registerF2Tests();
  registerF3Tests();
  registerF4Tests();
  registerF5Tests();
  registerF6Tests();
  registerF7Tests();
  registerF8Tests();
  registerF9Tests();
  registerF10Tests();
  registerF11Tests();
  registerF12Tests();
  registerF13Tests();
  registerF14Tests();
  registerF15Tests();

  // Tier 2: Boundary & Corner Cases (15 features)
  registerTier2Part1Tests();
  registerTier2Part2Tests();

  // Tier 3: Cross-Feature Interactions
  registerTier3Tests();

  // Tier 4: Real-World Scenarios (S1 to S8)
  registerTier4Tests();
}

async function runTestSuite(): Promise<void> {
  const globalStartTime = Date.now();
  console.log("===============================================================================");
  console.log("             AGROSTECH SAAS MVP — E2E TEST RUNNER (TIERS 1-4)                  ");
  console.log("===============================================================================");
  console.log(`Starting test execution at: ${new Date().toISOString()}`);

  registerAllSuites();
  const tests = getRegisteredTests();
  console.log(`Discovered ${tests.length} tests across Tiers 1, 2, 3, and 4.\n`);

  const results: TestResult[] = [];
  let currentTier = -1;

  for (const test of tests) {
    if (test.tier !== currentTier) {
      currentTier = test.tier;
      console.log(`\n-------------------------------------------------------------------------------`);
      console.log(`>>> ${test.tierName}`);
      console.log(`-------------------------------------------------------------------------------`);
    }

    const testStart = Date.now();
    try {
      await test.fn();
      const durationMs = Date.now() - testStart;
      results.push({
        tier: test.tier,
        tierName: test.tierName,
        featureId: test.featureId,
        name: test.name,
        passed: true,
        durationMs,
      });
      console.log(`  [PASS] [${test.featureId || "TEST"}] ${test.name} (${durationMs}ms)`);
    } catch (err: any) {
      const durationMs = Date.now() - testStart;
      const error = err instanceof Error ? err : new Error(String(err));
      results.push({
        tier: test.tier,
        tierName: test.tierName,
        featureId: test.featureId,
        name: test.name,
        passed: false,
        durationMs,
        error,
      });
      console.error(`  [FAIL] [${test.featureId || "TEST"}] ${test.name} (${durationMs}ms)`);
      console.error(`         ERROR: ${error.message}`);
      if (error.stack) {
        console.error(`         ${error.stack.split("\n").slice(1, 3).join("\n         ")}`);
      }
    }
  }

  const totalDuration = Date.now() - globalStartTime;

  // Tabulate Results per Tier
  const tierSummary: Record<
    number,
    { name: string; total: number; passed: number; failed: number; duration: number }
  > = {
    1: { name: "Tier 1: Feature Coverage (F1-F15)", total: 0, passed: 0, failed: 0, duration: 0 },
    2: { name: "Tier 2: Boundary & Corner Cases", total: 0, passed: 0, failed: 0, duration: 0 },
    3: { name: "Tier 3: Cross-Feature Interactions", total: 0, passed: 0, failed: 0, duration: 0 },
    4: { name: "Tier 4: Real-World Scenarios (S1-S8)", total: 0, passed: 0, failed: 0, duration: 0 },
  };

  for (const r of results) {
    if (!tierSummary[r.tier]) {
      tierSummary[r.tier] = { name: r.tierName, total: 0, passed: 0, failed: 0, duration: 0 };
    }
    tierSummary[r.tier].total++;
    tierSummary[r.tier].duration += r.durationMs;
    if (r.passed) {
      tierSummary[r.tier].passed++;
    } else {
      tierSummary[r.tier].failed++;
    }
  }

  console.log("\n===============================================================================");
  console.log("                             TEST RESULTS SUMMARY                              ");
  console.log("===============================================================================");
  console.log(
    `| ${"Test Tier".padEnd(42)} | ${"Total".padStart(6)} | ${"Passed".padStart(6)} | ${"Failed".padStart(6)} | ${"Time (ms)".padStart(9)} |`
  );
  console.log(`|${"-".repeat(44)}|${"-".repeat(8)}|${"-".repeat(8)}|${"-".repeat(8)}|${"-".repeat(11)}|`);

  let totalCount = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const tierKey of [1, 2, 3, 4]) {
    const s = tierSummary[tierKey];
    if (s) {
      totalCount += s.total;
      totalPassed += s.passed;
      totalFailed += s.failed;
      console.log(
        `| ${s.name.padEnd(42)} | ${String(s.total).padStart(6)} | ${String(s.passed).padStart(6)} | ${String(s.failed).padStart(6)} | ${String(s.duration).padStart(9)} |`
      );
    }
  }

  console.log(`|${"-".repeat(44)}|${"-".repeat(8)}|${"-".repeat(8)}|${"-".repeat(8)}|${"-".repeat(11)}|`);
  console.log(
    `| ${"OVERALL TOTAL".padEnd(42)} | ${String(totalCount).padStart(6)} | ${String(totalPassed).padStart(6)} | ${String(totalFailed).padStart(6)} | ${String(totalDuration).padStart(9)} |`
  );
  console.log("===============================================================================\n");

  if (totalFailed > 0) {
    console.error(`❌ TEST SUITE FAILED: ${totalFailed} of ${totalCount} tests failed.`);
    process.exit(1);
  } else {
    console.log(`✅ TEST SUITE PASSED: All ${totalPassed} tests passed successfully!`);
    console.log(`Execution completed cleanly in ${(totalDuration / 1000).toFixed(2)}s.`);
    process.exit(0);
  }
}

// Execute runner if invoked directly
runTestSuite().catch((err) => {
  console.error("Unhandled error in test runner execution:", err);
  process.exit(1);
});
