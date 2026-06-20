import type { Detector, Match } from "../types.js";
import { resolveByStart } from "./util.js";

/**
 * Phone detector — **best-effort candidate detection** (research §3): full validation is
 * metadata-driven (libphonenumber) and impossible by regex alone, so we detect plausible
 * North-American (NANP) and E.164 numbers and accept this is not full validation.
 *
 * - E.164: `+` then 7–15 digits, leading digit non-zero, no separators.
 * - NANP: optional country code `1`, area & exchange beginning `[2-9]`, 4-digit line, with
 *   common separators (space, `.`, `-`, parens) — the `[2-9]` rules cut the worst false
 *   positives (no NANP area/exchange starts with 0 or 1).
 */
const E164_RE = /\+[1-9]\d{6,14}/g;
const NANP_RE = /(?:\+?1[ .-]?)?\(?[2-9]\d{2}\)?[ .-]?[2-9]\d{2}[ .-]?\d{4}/g;

function collect(text: string, re: RegExp): Match[] {
  const out: Match[] = [];
  for (const m of text.matchAll(re)) {
    if (m.index === undefined) continue;
    out.push({ type: "PHONE", value: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

export const phoneDetector: Detector = {
  type: "PHONE",
  detect(text: string): Match[] {
    return resolveByStart([...collect(text, E164_RE), ...collect(text, NANP_RE)]);
  },
};
