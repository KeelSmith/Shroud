/**
 * Core detection types for Shroud.
 *
 * Design: a per-entity {@link Detector} owns its pattern(s) and any validation, and reports
 * {@link Match} spans. See `docs/decisions/0003-detection-layer.md` and
 * `docs/research/detection-prior-art.md`.
 */

/** The sensitive-value categories Shroud's free core detects. */
export type DetectionType = "EMAIL" | "PHONE" | "CARD" | "SECRET";

/** A single detected span within an input string. `end` is exclusive (`text.slice(start, end)`). */
export interface Match {
  readonly type: DetectionType;
  readonly value: string;
  readonly start: number;
  readonly end: number;
}

/**
 * A detector for one {@link DetectionType}. `detect` is pure (no I/O) and returns
 * non-overlapping matches for its own type, in any order (the aggregator sorts/merges).
 */
export interface Detector {
  readonly type: DetectionType;
  detect(text: string): Match[];
}

/**
 * Reverse mapping returned by {@link redact}: placeholder string → original value.
 * A plain object so it is JSON-serializable across a redact-here / send-there /
 * rehydrate-here boundary. See `docs/contracts/0001-redaction-interface.md`.
 */
export type Mapping = Record<string, string>;

/** Options for {@link redact}. */
export interface RedactOptions {
  /** Restrict which detector types run. Default: all four. An empty array detects nothing. */
  types?: DetectionType[];
}

/** Result of {@link redact}: the redacted text and the mapping needed to restore it. */
export interface RedactResult {
  text: string;
  mapping: Mapping;
}
