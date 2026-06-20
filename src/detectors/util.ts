import type { Match } from "../types.js";

/**
 * Reduce a single detector's (possibly overlapping) matches to a non-overlapping set:
 * earliest start wins, ties broken by longer span. Returns matches sorted by start.
 */
export function resolveByStart(matches: readonly Match[]): Match[] {
  const sorted = [...matches].sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start),
  );
  const out: Match[] = [];
  let lastEnd = -1;
  for (const m of sorted) {
    if (m.start >= lastEnd) {
      out.push(m);
      lastEnd = m.end;
    }
  }
  return out;
}
