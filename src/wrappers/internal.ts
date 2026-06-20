import { redact } from "../redact.js";
import { rehydrate } from "../rehydrate.js";
import type { Mapping, RedactOptions } from "../types.js";

/**
 * Boundary char used to redact many request fields under one shared mapping. A NUL (U+0000)
 * is used because no detector matches across it; built via `fromCharCode` to avoid a literal
 * NUL byte in source.
 */
const SEP = String.fromCharCode(0);

/**
 * Redact several strings under a **single shared mapping**, so identical values across
 * different request fields collapse to the same placeholder and numbering is consistent.
 * Implemented over the audited `redact()` by joining on the NUL boundary and splitting back.
 * NUL in input is rejected loudly rather than risk corruption.
 */
export function redactStrings(
  strings: readonly string[],
  options?: RedactOptions,
): { redacted: string[]; mapping: Mapping } {
  if (strings.length === 0) return { redacted: [], mapping: {} };
  for (const s of strings) {
    if (s.includes(SEP)) {
      throw new Error(
        "shroud: input text contains a NUL (U+0000) character, which the SDK wrappers do not support.",
      );
    }
  }
  const { text, mapping } = redact(strings.join(SEP), options);
  return { redacted: text.split(SEP), mapping };
}

export { rehydrate };
