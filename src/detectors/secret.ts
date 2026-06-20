import type { Detector, Match } from "../types.js";
import { resolveByStart } from "./util.js";

/**
 * API-key / secret detector. Uses only the **distinctive, prefix-anchored** provider shapes
 * curated by gitleaks (research §5) — these are near-zero false-positive because the prefix +
 * fixed length (and, for OpenAI, the `T3BlbkFJ` anchor) are unambiguous. Generic high-entropy
 * detection is deliberately out of scope for the free core (needs an allowlist corpus to meet
 * the zero-false-positive bar — see ADR-0003).
 */
const SECRET_RES: readonly RegExp[] = [
  // OpenAI project/service/admin keys (T3BlbkFJ-anchored) and the legacy form.
  /sk-(?:proj|svcacct|admin)-(?:[A-Za-z0-9_-]{74}|[A-Za-z0-9_-]{58})T3BlbkFJ(?:[A-Za-z0-9_-]{74}|[A-Za-z0-9_-]{58})/g,
  /sk-[A-Za-z0-9]{20}T3BlbkFJ[A-Za-z0-9]{20}/g,
  // AWS access key id.
  /(?:A3T[A-Z0-9]|AKIA|ASIA|ABIA|ACCA)[A-Z2-7]{16}/g,
  // GitHub personal access token + fine-grained token.
  /ghp_[0-9A-Za-z]{36}/g,
  /github_pat_\w{82}/g,
  // Google API key.
  /AIza[\w-]{35}/g,
  // Slack bot token.
  /xoxb-[0-9]{10,13}-[0-9]{10,13}[A-Za-z0-9-]*/g,
  // Stripe secret / restricted key.
  /(?:sk|rk)_(?:test|live|prod)_[A-Za-z0-9]{10,99}/g,
];

export const secretDetector: Detector = {
  type: "SECRET",
  detect(text: string): Match[] {
    const out: Match[] = [];
    for (const re of SECRET_RES) {
      for (const m of text.matchAll(re)) {
        if (m.index === undefined) continue;
        out.push({ type: "SECRET", value: m[0], start: m.index, end: m.index + m[0].length });
      }
    }
    return resolveByStart(out);
  },
};
