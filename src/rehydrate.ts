import type { Mapping } from "./types.js";

/**
 * Restore original values in `text` by replacing every placeholder present as a key in
 * `mapping` with its original. Unknown placeholders are left untouched (tolerant reader).
 * Longer placeholders are replaced first as a defensive measure (bracketed `[SHROUD_…]`
 * tokens already cannot prefix-collide). See `docs/contracts/0001-redaction-interface.md`.
 */
export function rehydrate(text: string, mapping: Mapping): string {
  const placeholders = Object.keys(mapping).sort((a, b) => b.length - a.length);
  let out = text;
  for (const placeholder of placeholders) {
    const original = mapping[placeholder];
    if (original === undefined) continue;
    out = out.split(placeholder).join(original);
  }
  return out;
}
