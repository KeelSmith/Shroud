---
status: accepted
date: 2026-06-18
---

# Contract 0001 — Redaction interface (`redact` / `rehydrate`)

> The product spec for Shroud's public core, authored with the code it governs
> (unit `redact-rehydrate`). Implementations cite this contract as authority. The *why* is in
> [ADR-0002](../decisions/0002-redaction-architecture.md); this is the *what*.

## Purpose & scope

Defines the public, reversible redaction API: `redact` (remove sensitive values, return a
mapping) and `rehydrate` (restore originals from a mapping). Governs the exported types and
their guarantees. Does **not** govern the detectors' internals (Contract-free; see ADR-0003)
or the SDK wrappers (a later contract).

## The interface / shapes

```ts
type DetectionType = "EMAIL" | "PHONE" | "CARD" | "SECRET";

/** placeholder string -> original value. JSON-serializable. */
type Mapping = Record<string, string>;

interface RedactOptions {
  /** Restrict which detector types run. Default: all four. */
  types?: DetectionType[];
}

interface RedactResult {
  /** Input with each detected value replaced by a `[SHROUD_<TYPE>_<n>]` placeholder. */
  text: string;
  /** Reverse mapping for `rehydrate`. */
  mapping: Mapping;
}

function redact(text: string, options?: RedactOptions): RedactResult;
function rehydrate(text: string, mapping: Mapping): string;
```

**Invariants:**
- **Placeholder form:** `[SHROUD_<TYPE>_<n>]`, `n` a per-type 1-based counter assigned in order
  of first appearance.
- **Value-dedup:** identical detected values of the same type map to the **same** placeholder.
- **Reversibility:** `rehydrate(redact(t).text, redact(t).mapping) === t` for all `t`
  (subject to the collision limit below).
- **Determinism / purity:** `redact` performs no I/O; equal inputs yield equal outputs.
- **Serializability:** `mapping` survives `JSON.parse(JSON.stringify(mapping))` unchanged.

## Fail-mode posture

Tolerant reader, strict writer:
- `redact("")` → `{ text: "", mapping: {} }`. Text with no detections → input unchanged, empty
  mapping. Never throws on ordinary string input.
- `rehydrate(text, {})` → `text` unchanged. `rehydrate` replaces only exact placeholder tokens
  present as keys in `mapping`; unknown placeholders in `text` are left as-is (lenient).
- `options.types` with an empty array → no detectors run → input returned unchanged.
- These are pure string functions with **no machine-state side effects**, so Rule 8's
  "consequential outcome with no trace" does not apply; there is nothing to fail closed.

**Documented limit (not a silent assumption):** if the input text *already literally contains*
a `[SHROUD_<TYPE>_<n>]` token, round-trip exactness is not guaranteed for that token. Recorded
in `README.md` and `SECURITY.md`; acceptable for v0 (vanishingly rare in real prompts).

## Acceptance criteria

Each maps to a test in the `redact-rehydrate` unit:
1. Replacement + dedup (a repeated value → one placeholder, restored everywhere).
2. Property-based round-trip over randomized PII-bearing inputs (fast-check).
3. `mapping` JSON-round-trips unchanged.
4. `options.types` restricts detection; empty array → unchanged input.
5. Empty / detection-free input → unchanged text + empty mapping.
6. `src/index.ts` exports exactly the surface above.

## Authorship / acceptance / supersession

Authored by the project maintainer, unit `redact-rehydrate`, 2026-06-18. The **operator accepts**
(flips `draft` → `accepted`) at unit completion. Amendments are additive and land in the same
change as the behavior they describe; supersession follows `docs/decisions` conventions.
