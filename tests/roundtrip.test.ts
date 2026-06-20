import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { redact } from "../src/redact.js";
import { rehydrate } from "../src/rehydrate.js";

const cat = (...parts: string[]): string => parts.join("");

// Real, detectable values across all four types (cards are Luhn-valid test numbers;
// secrets assembled from parts so no full key literal is committed).
const piiArb = fc.oneof(
  fc.constantFrom("jane@acme.com", "a@b.org", "x.y+z@sub.example.co.uk"),
  fc.constantFrom("415-555-0132", "(212) 555-0190", "+14155550132"),
  fc.constantFrom("4111111111111111", "5555555555554444", "378282246310005"),
  fc.constantFrom(cat("AKIA", "ABCDEFGHIJKLMNOP"), cat("ghp_", "z".repeat(36))),
);

// Plain words only (no digits / @ / brackets) so filler never forms spurious matches.
const fillerArb = fc.constantFrom(
  "the", "quick", "brown", "fox", "please", "contact", "now", "and", "regarding", "today",
);

describe("round-trip property", () => {
  it("rehydrate(redact(t).text, mapping) === t for PII-bearing text", () => {
    fc.assert(
      fc.property(fc.array(fc.oneof(piiArb, fillerArb), { maxLength: 12 }), (segments) => {
        const text = segments.join(" ");
        const { text: redacted, mapping } = redact(text);
        expect(rehydrate(redacted, mapping)).toBe(text);
      }),
      { numRuns: 300 },
    );
  });

  it("the redacted text no longer contains the original value", () => {
    fc.assert(
      fc.property(piiArb, (value) => {
        const { text } = redact(`value is ${value} ok`);
        expect(text.includes(value)).toBe(false);
      }),
    );
  });
});
