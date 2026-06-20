import type { Detector, Match } from "../types.js";

// Local-part character class (WHATWG/HTML5), defined once and reused in the leading negative
// lookbehind below. The lookbehind ensures a match can only START at a real left boundary;
// without it, a long run of local-part characters with no "@" makes `matchAll` retry from
// every offset — quadratic backtracking / ReDoS (regression-guarded by tests/redos.test.ts).
const LOCAL = "A-Za-z0-9.!#$%&'*+/=?^_`{|}~-";

/**
 * Email detector. Based on the WHATWG/HTML5 `<input type=email>` pattern (research §2),
 * adapted for scanning free text and made stricter for redaction by **requiring a dotted
 * domain** (the trailing `+` over `(?:\.label)`), so TLD-less strings like `foo@bar` are
 * not matched. The leading `(?<![LOCAL])` keeps matching linear on adversarial input.
 * Evidence: `docs/research/detection-prior-art.md` §2.
 */
const EMAIL_RE = new RegExp(
  `(?<![${LOCAL}])[${LOCAL}]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+`,
  "g",
);

export const emailDetector: Detector = {
  type: "EMAIL",
  detect(text: string): Match[] {
    const out: Match[] = [];
    for (const m of text.matchAll(EMAIL_RE)) {
      if (m.index === undefined) continue;
      out.push({ type: "EMAIL", value: m[0], start: m.index, end: m.index + m[0].length });
    }
    return out;
  },
};
