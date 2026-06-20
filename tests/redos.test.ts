import { describe, it, expect } from "vitest";
import { emailDetector } from "../src/detectors/email.js";
import { phoneDetector } from "../src/detectors/phone.js";
import { cardDetector } from "../src/detectors/card.js";
import { secretDetector } from "../src/detectors/secret.js";
import { detectAll } from "../src/detectors/index.js";
import type { Detector } from "../src/types.js";

// Generous budget: detection on a 100k-char adversarial input must complete well under this.
// A catastrophically-backtracking regex would blow past it; a linear scan finishes in ms.
const BUDGET_MS = 750;

function elapsed(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

// Inputs crafted to provoke backtracking in each detector's patterns.
const adversarial: Record<string, string> = {
  "local part, no @": "a".repeat(100_000),
  "@ then no dot": `${"a".repeat(50_000)}@${"a".repeat(50_000)}`,
  "@ then long partial domain": `x@${"a".repeat(100_000)}`,
  "many dotted labels": `x@${"a.".repeat(40_000)}a`,
  "long digit run": "1".repeat(100_000),
  "spaced digit run": "1 ".repeat(50_000),
  "hyphenated digit run": "1-".repeat(50_000),
  "sk- prefix flood": `sk-${"a".repeat(100_000)}`,
  "mixed soup": "jane@acme.com 4111111111111111 415-555-0132 ".repeat(5_000),
};

const detectors: Detector[] = [emailDetector, phoneDetector, cardDetector, secretDetector];

describe("ReDoS / performance guard", () => {
  for (const [name, input] of Object.entries(adversarial)) {
    it(`detectAll stays within budget: ${name}`, () => {
      expect(elapsed(() => detectAll(input))).toBeLessThan(BUDGET_MS);
    });
  }

  it("every individual detector stays within budget on every adversarial input", () => {
    for (const detector of detectors) {
      for (const [name, input] of Object.entries(adversarial)) {
        const ms = elapsed(() => detector.detect(input));
        expect(ms, `${detector.type} on "${name}" (len ${String(input.length)})`).toBeLessThan(
          BUDGET_MS,
        );
      }
    }
  });
});
