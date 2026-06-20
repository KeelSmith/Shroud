---
status: accepted
date: 2026-06-17
significance: tier-1
supersedes: none
superseded-by: none
provenance: maintainer recommendation, 2026-06-17, unit "scaffold" — accepted 2026-06-18 (publish-polish)
---

# ADR-0002 — Reversible redaction architecture

## Context — the forces at play

Shroud's core promise is a **reversible round-trip**: sensitive values are replaced with
placeholders before text leaves the process, and the originals are restored from the model's
reply. The design must (a) be a pure, I/O-free core (testable to a high coverage bar, safe
to run anywhere), (b) survive being sent through a third-party model that may echo the
placeholders, and (c) keep the value↔placeholder mapping in a form the caller can hold or
serialize. design idioms in play: pure DI core / impure shell, reader/writer split,
single-source constants, property-based + fail-safe-invariant tests.

## Decision

1. **Pure core.** `redact` and `rehydrate` are pure functions with no I/O, no network, no
   process control (enforced by `no-console` / `no-process-exit` lint rules).
2. **Placeholder format:** `[SHROUD_<TYPE>_<n>]` where `TYPE ∈ {EMAIL, PHONE, CARD, SECRET}`
   and `n` is a per-type, 1-based counter assigned in order of first appearance. This mirrors
   the **proven LLM Guard format** `[REDACTED_<TYPE>_<n>]` (bracketed, underscore-delimited,
   type + index; `anonymize.py`, Tier A) — namespaced to `SHROUD` to lower collision with
   real text and with LLM-Guard's own tokens. Evidence: `docs/research/detection-prior-art.md` §6.
3. **Deterministic de-duplication.** Within one `redact()` call, identical values map to the
   same placeholder, so a repeated value is redacted once and rehydrates everywhere.
4. **Detector pipeline with explicit precedence.** Detectors run in a fixed order; once a
   character span is claimed it is not re-matched. Precedence: `EMAIL` → `SECRET` (prefixed
   API keys / high-entropy tokens) → `CARD` (13–19 digits, **Luhn-validated**) → `PHONE`.
   The order resolves digit-run ambiguity (a Luhn-valid 16-digit run is a card, not a phone).
5. **Serializable mapping.** `redact()` returns `{ text, mapping }` where
   `mapping: Mapping` maps each placeholder string to its original value
   (`Record<string, string>`), so it can be JSON-stored or passed alongside the request.
6. **`rehydrate(text, mapping)`** replaces every placeholder occurrence with its original via
   exact-token substitution (bracketed tokens cannot prefix-collide, e.g. `_1]` vs `_11]`).
7. **Options:** `RedactOptions.types?` restricts which detectors run; the placeholder scheme
   and detector set are otherwise single-sourced constants.

## Rationale & rejected alternatives

- **Bracketed sentinel `[SHROUD_<TYPE>_<n>]` (chosen):** human-readable, model-stable,
  reversible, self-describing — and matches the shape proven by LLM Guard (the closest prior
  art), so we inherit its de-dup design rather than inventing one.
- *Rejected — opaque UUID placeholders:* survive models well but are unreadable and make the
  redacted text useless to inspect.
- *Rejected — hashing / format-preserving tokenization:* heavier, and irreversible hashing
  defeats the rehydrate promise; format-preserving encryption is out of scope for the free
  core.
- *Rejected — a `Map` mapping:* not JSON-serializable; a plain object travels across the
  redact-here / send-there / rehydrate-here boundary cleanly.
- *Rejected — regex-only card detection:* too many false positives; Luhn validation is the
  cheap precision win.

## Consequences

- Easier: a pure, deterministic core reaches very high test coverage; the mapping is easy to
  store and the round-trip is property-testable.
- Harder: precedence between detectors must be maintained as detectors are added (covered by
  canonical-set tests). A literal `[SHROUD_…]` token already present in input is an
  acknowledged edge case (documented limit in SECURITY/README).

## Enforcement link

- Mechanical: a **property-based round-trip test**
  (`rehydrate(redact(t).text, redact(t).mapping) === t`) and a **canonical-set test** pinning
  the detector order; the pure-core invariant is held by the `no-console` / `no-process-exit`
  lint rules; coverage thresholds (vitest) gate the core.
- Judgment-layer: "is the detector set good enough for a user's threat model" is a review
  question, surfaced honestly in SECURITY.md (detection is best-effort, not a guarantee).

## Context-notes (dated, additive only)

- 2026-06-17: Evidence pass completed (`docs/research/detection-prior-art.md`). Placeholder
  format revised from a colon-delimited draft to `[SHROUD_<TYPE>_<n>]`, anchored to LLM
  Guard's proven `[REDACTED_<TYPE>_<n>]` shape + value-dedup vault (Tier A). **Carried-forward
  unknown:** *which* token format best survives an LLM round-trip is **inconclusive** in the
  evidence — to be validated empirically with a real-host LLM smoke test (a real-host smoke) in the
  wrappers/publish unit; a mangled/echoed-wrong placeholder is a finding, not a pass.
- 2026-06-18: **Real-host smoke PASSED** (operator-run, `examples/smoke-llm.mjs`, OpenAI
  `gpt-4o-mini`). The model received only `[SHROUD_EMAIL_1]` / `[SHROUD_PHONE_1]`, echoed them
  verbatim, and `rehydrate` restored `jane@acme.com` / `415-555-0132` exactly. The
  carried-forward placeholder-survival unknown is **resolved for this format on this model**;
  broaden across models/providers over time (the smoke script also supports Anthropic).
