import type { Detector, Match } from "../types.js";
import { emailDetector } from "./email.js";
import { secretDetector } from "./secret.js";
import { cardDetector } from "./card.js";
import { phoneDetector } from "./phone.js";

/**
 * Detector precedence (ADR-0002): EMAIL → SECRET → CARD → PHONE. On overlap the
 * higher-precedence type wins (e.g. a Luhn-valid 16-digit run is a CARD, not a PHONE).
 */
export const DEFAULT_DETECTORS: readonly Detector[] = [
  emailDetector,
  secretDetector,
  cardDetector,
  phoneDetector,
];

/**
 * Run all detectors and return non-overlapping matches ordered by position. On overlap the
 * higher-precedence detector wins.
 *
 * Resolved in a single sort + sweep — O(n log n) in the number of matches — rather than an
 * O(n²) pairwise scan, so inputs with very many matches stay fast (regression-guarded by
 * tests/redos.test.ts "mixed soup").
 */
export function detectAll(
  text: string,
  detectors: readonly Detector[] = DEFAULT_DETECTORS,
): Match[] {
  const tagged: { m: Match; prec: number }[] = [];
  detectors.forEach((detector, prec) => {
    for (const m of detector.detect(text)) tagged.push({ m, prec });
  });

  // Earliest start wins; ties broken by higher precedence (lower index), then longer span.
  tagged.sort(
    (a, b) =>
      a.m.start - b.m.start ||
      a.prec - b.prec ||
      b.m.end - b.m.start - (a.m.end - a.m.start),
  );

  const kept: Match[] = [];
  let lastEnd = -1;
  for (const { m } of tagged) {
    if (m.start >= lastEnd) {
      kept.push(m);
      lastEnd = m.end;
    }
  }
  return kept;
}
