/**
 * Agrostech E2E Test Suite Harness
 * Deterministic, Opaque-Box Test Framework for Tiers 1-4
 */

export interface TestCase {
  tier: number;
  tierName: string;
  featureId?: string;
  name: string;
  fn: () => void | Promise<void>;
}

export interface TestResult {
  tier: number;
  tierName: string;
  featureId?: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

const testRegistry: TestCase[] = [];

/**
 * Register a test case in the test harness
 */
export function registerTest(
  tier: number,
  tierName: string,
  featureId: string,
  name: string,
  fn: () => void | Promise<void>
): void {
  testRegistry.push({ tier, tierName, featureId, name, fn });
}

/**
 * Convenience helper for Tier 1
 */
export function testTier1(featureId: string, name: string, fn: () => void | Promise<void>): void {
  registerTest(1, "Tier 1 — Feature Coverage", featureId, name, fn);
}

/**
 * Convenience helper for Tier 2
 */
export function testTier2(featureId: string, name: string, fn: () => void | Promise<void>): void {
  registerTest(2, "Tier 2 — Boundary & Corner Cases", featureId, name, fn);
}

/**
 * Convenience helper for Tier 3
 */
export function testTier3(interactionId: string, name: string, fn: () => void | Promise<void>): void {
  registerTest(3, "Tier 3 — Cross-Feature Interactions", interactionId, name, fn);
}

/**
 * Convenience helper for Tier 4
 */
export function testTier4(scenarioId: string, name: string, fn: () => void | Promise<void>): void {
  registerTest(4, "Tier 4 — Real-World Application Scenarios", scenarioId, name, fn);
}

export function getRegisteredTests(): TestCase[] {
  return [...testRegistry];
}

export function clearRegistry(): void {
  testRegistry.length = 0;
}

// ---------------------------------------------------------------------------
// Assertion Library (Zero External Dependencies, Strict Opaque-Box)
// ---------------------------------------------------------------------------

export class AssertionError extends Error {
  public actual?: unknown;
  public expected?: unknown;

  constructor(message: string, actual?: unknown, expected?: unknown) {
    super(message);
    this.name = "AssertionError";
    this.actual = actual;
    this.expected = expected;
  }
}

export function assertTrue(condition: unknown, message = "Expected condition to be truthy"): asserts condition {
  if (!condition) {
    throw new AssertionError(message, condition, true);
  }
}

export function assertFalse(condition: unknown, message = "Expected condition to be falsy"): void {
  if (condition) {
    throw new AssertionError(message, condition, false);
  }
}

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    const msg = message || `Expected: ${JSON.stringify(expected)}, received: ${JSON.stringify(actual)}`;
    throw new AssertionError(msg, actual, expected);
  }
}

export function assertApprox(actual: number, expected: number, tolerance = 0.001, message?: string): void {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    const msg = message || `Expected ${actual} to be within ${tolerance} of ${expected} (diff: ${diff})`;
    throw new AssertionError(msg, actual, expected);
  }
}

export function assertDeepEqual(actual: unknown, expected: unknown, message?: string): void {
  const actualStr = JSON.stringify(actual, Object.keys(actual as any || {}).sort());
  const expectedStr = JSON.stringify(expected, Object.keys(expected as any || {}).sort());
  if (actualStr !== expectedStr) {
    const msg = message || `Deep equality mismatch.\nExpected: ${expectedStr}\nReceived: ${actualStr}`;
    throw new AssertionError(msg, actual, expected);
  }
}

export function assertMatch(value: string, pattern: RegExp, message?: string): void {
  if (!pattern.test(value)) {
    const msg = message || `Expected string "${value}" to match pattern ${pattern.toString()}`;
    throw new AssertionError(msg, value, pattern.toString());
  }
}

export function assertThrows(fn: () => unknown, expected?: string | RegExp | Function, message?: string): void {
  let thrown = false;
  let caughtError: unknown = null;
  try {
    fn();
  } catch (err) {
    thrown = true;
    caughtError = err;
  }

  if (!thrown) {
    throw new AssertionError(message || "Expected function to throw an error, but it returned normally.");
  }

  if (expected) {
    const errMessage = caughtError instanceof Error ? caughtError.message : String(caughtError);
    const errCode = (caughtError as any)?.code || "";

    if (typeof expected === "string") {
      if (!errMessage.includes(expected) && !errCode.includes(expected)) {
        throw new AssertionError(
          `Expected error containing "${expected}", got: ${errMessage} (code: ${errCode})`
        );
      }
    } else if (expected instanceof RegExp) {
      if (!expected.test(errMessage) && !expected.test(errCode)) {
        throw new AssertionError(`Expected error matching ${expected}, got: ${errMessage}`);
      }
    } else if (typeof expected === "function") {
      if (!(caughtError instanceof expected)) {
        throw new AssertionError(`Expected error instance of ${expected.name}, got: ${caughtError}`);
      }
    }
  }
}

export async function assertRejects(
  fn: () => Promise<unknown>,
  expected?: string | RegExp | Function,
  message?: string
): Promise<void> {
  let thrown = false;
  let caughtError: unknown = null;
  try {
    await fn();
  } catch (err) {
    thrown = true;
    caughtError = err;
  }

  if (!thrown) {
    throw new AssertionError(message || "Expected promise to reject, but it resolved.");
  }

  if (expected) {
    const errMessage = caughtError instanceof Error ? caughtError.message : String(caughtError);
    const errCode = (caughtError as any)?.code || "";

    if (typeof expected === "string") {
      if (!errMessage.includes(expected) && !errCode.includes(expected)) {
        throw new AssertionError(
          `Expected rejection containing "${expected}", got: ${errMessage} (code: ${errCode})`
        );
      }
    } else if (expected instanceof RegExp) {
      if (!expected.test(errMessage) && !expected.test(errCode)) {
        throw new AssertionError(`Expected rejection matching ${expected}, got: ${errMessage}`);
      }
    } else if (typeof expected === "function") {
      if (!(caughtError instanceof expected)) {
        throw new AssertionError(`Expected rejection instance of ${expected.name}, got: ${caughtError}`);
      }
    }
  }
}
