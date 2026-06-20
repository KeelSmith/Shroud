---
status: accepted
date: 2026-06-17
significance: tier-1
supersedes: none
superseded-by: none
provenance: maintainer recommendation, 2026-06-17, unit "detectors" — accepted 2026-06-18 (publish-polish)
---

# ADR-0003 — Detection-layer design & pattern sourcing

## Context — the forces at play

The free core must detect email, phone, credit-card, and API-key/secret values. Detector
*patterns* are implementation specifics (the no-invented-specifics rule) and must be **evidence-anchored, not
invented**. A research pass (`docs/research/detection-prior-art.md`, 2026-06-17) established
the prior art from Tier-A primary sources (Presidio, WHATWG, libphonenumber, gitleaks, LLM
Guard, Google Cloud DLP). This ADR records the design those sources support.

## Decision

1. **Recognizer + validation-hook architecture** (mirrors Presidio): each `Detector` owns its
   regex(es) and an optional post-match validation step (Luhn for cards; prefix/anchor/length
   for secrets). Detection is decoupled from acceptance.
2. **EMAIL** — the WHATWG/HTML5 `<input type=email>` regex, with a **stricter redaction
   variant requiring a dotted domain** (reject TLD-less `foo@bar`) to cut false positives in
   free text.
3. **PHONE** — best-effort **candidate detection only** (regex cannot fully validate without
   per-territory metadata): NANP (`[2-9]` area/exchange rules, common separators, optional
   `+1`) + E.164 (`+<cc><digits>`, ≤15 digits). Documented as best-effort in `SECURITY.md`.
4. **CARD** — candidate of 13–19 digits (optional single space/hyphen separators), accepted
   only if **Luhn-valid AND length ∈ network set AND a matching IIN/BIN prefix** (table in the
   research doc §4: Visa/Mastercard incl. 2221–2720/Amex/Discover/Diners/JCB/UnionPay).
5. **SECRET** — the **distinctive prefix-anchored** gitleaks patterns only (OpenAI
   `…T3BlbkFJ…`, AWS `AKIA…`, GitHub `ghp_`/`github_pat_`, Google `AIza…`, Slack `xoxb-…`,
   Stripe `(?:sk|rk)_(?:test|live|prod)_…`). The **generic high-entropy** detector is
   **deferred** (needs a must-allow stopword corpus to meet the zero-false-positive bar,
   the quality bar — its own future unit).
6. **Precedence** (per ADR-0002): EMAIL → SECRET → CARD → PHONE; first claim wins; `detectAll`
   returns non-overlapping, position-ordered matches.

## Rationale & rejected alternatives

- **Evidence-anchored patterns (chosen):** every regex/table cites a Tier-A source; no
  invented constants (Rule 7). Prefix-anchored secrets give near-zero false positives.
- *Rejected — hand-rolled regexes from memory:* exactly the invented-specifics failure mode
  the verify-against-source rule forbids; the research pass replaced them.
- *Rejected — generic high-entropy secret detection in the free core now:* high false-positive
  risk without a tuned allowlist; deferred with a removal trigger (R2) rather than shipped weak.
- *Rejected — full phone validation:* requires bundling libphonenumber metadata (~80–500 kB),
  breaking the zero-dependency goal; we detect candidates and say so honestly.

## Consequences

- Easier: high precision (Luhn+prefix, anchored secrets), zero runtime deps, patterns
  traceable to source.
- Harder: phone/card/secret coverage is deliberately bounded (best-effort, distinctive shapes
  only); these limits are documented, not hidden. Upstream patterns drift — pin to a source
  revision when encoding (research §"Open questions").

## Enforcement link

- Mechanical: per-detector unit tests (positives + must-allow negatives), a Luhn test, a
  canonical-set test pinning detector order, coverage thresholds (vitest). A future
  constant-citation check could assert each pattern cites the research doc (graduation
  trigger the quality bar if a pattern ever ships unsourced).
- Judgment-layer: "is this detector set sufficient for a user's threat model" → review
  question, answered honestly in `SECURITY.md` (best-effort, not a guarantee).

## Context-notes (dated, additive only)
