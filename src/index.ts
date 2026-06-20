/**
 * Shroud — hide sensitive data from your AI calls and get it back automatically.
 * Public entry point. See `docs/contracts/0001-redaction-interface.md`.
 */
export { redact } from "./redact.js";
export { rehydrate } from "./rehydrate.js";
export { DEFAULT_DETECTORS, detectAll } from "./detectors/index.js";
export type {
  DetectionType,
  Match,
  Detector,
  Mapping,
  RedactOptions,
  RedactResult,
} from "./types.js";
