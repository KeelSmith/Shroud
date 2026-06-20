/**
 * Luhn (mod-10) checksum — the standard credit-card check digit validation.
 * Input must be digits only; any non-digit makes it invalid.
 * Evidence: `docs/research/detection-prior-art.md` §4 (Presidio, Google Cloud DLP).
 */
export function luhn(digits: string): boolean {
  if (digits.length === 0) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    const code = digits.charCodeAt(i);
    if (code < 48 || code > 57) return false;
    let d = code - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}
