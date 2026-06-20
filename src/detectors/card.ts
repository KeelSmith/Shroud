import type { Detector, Match } from "../types.js";
import { luhn } from "./luhn.js";

/**
 * Credit-card detector: a 13–19 digit candidate (single space/hyphen separators allowed),
 * accepted only when it is **Luhn-valid AND its length+prefix match a known network**
 * (research §4 — Visa/Mastercard incl. 2-series/Amex/Discover/Diners/JCB/UnionPay). This
 * combination is what keeps precision high (vs. matching any long digit run).
 */
const CANDIDATE_RE = /\d(?:[ -]?\d){12,18}/g;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** True if `d` (digits only) matches a known network's prefix + length. */
function isKnownNetwork(d: string): boolean {
  const len = d.length;
  const p = (n: number): number => Number(d.slice(0, n));
  if (d.startsWith("4") && (len === 13 || len === 16 || len === 19)) return true; // Visa
  if ((p(2) === 34 || p(2) === 37) && len === 15) return true; // American Express
  if (((p(2) >= 51 && p(2) <= 55) || (p(4) >= 2221 && p(4) <= 2720)) && len === 16) return true; // Mastercard
  if (
    (p(4) === 6011 || p(2) === 65 || (p(3) >= 644 && p(3) <= 649) || (p(6) >= 622126 && p(6) <= 622925)) &&
    len >= 16 &&
    len <= 19
  ) {
    return true; // Discover
  }
  if ((p(2) === 30 || p(2) === 36 || p(2) === 38 || p(2) === 39) && len >= 14 && len <= 19) return true; // Diners Club
  if (p(4) >= 3528 && p(4) <= 3589 && len >= 16 && len <= 19) return true; // JCB
  if (p(2) === 62 && len >= 16 && len <= 19) return true; // UnionPay
  return false;
}

export const cardDetector: Detector = {
  type: "CARD",
  detect(text: string): Match[] {
    const out: Match[] = [];
    for (const m of text.matchAll(CANDIDATE_RE)) {
      if (m.index === undefined) continue;
      const value = m[0];
      const d = digitsOnly(value);
      if (d.length >= 13 && d.length <= 19 && isKnownNetwork(d) && luhn(d)) {
        out.push({ type: "CARD", value, start: m.index, end: m.index + value.length });
      }
    }
    return out;
  },
};
