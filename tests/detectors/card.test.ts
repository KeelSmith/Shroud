import { describe, it, expect } from "vitest";
import { cardDetector } from "../../src/detectors/card.js";
import { luhn } from "../../src/detectors/luhn.js";

/** Build a Luhn-valid number of `length` digits beginning with `prefix` (zero-padded body). */
function makeCard(prefix: string, length: number): string {
  let body = prefix;
  while (body.length < length - 1) body += "0";
  let sum = 0;
  let double = true;
  for (let i = body.length - 1; i >= 0; i--) {
    let d = body.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return body + String((10 - (sum % 10)) % 10);
}

describe("cardDetector", () => {
  it("detects every supported network (Luhn-valid)", () => {
    const cards = [
      makeCard("4", 13), // Visa 13
      makeCard("4", 16), // Visa 16
      makeCard("4", 19), // Visa 19
      makeCard("34", 15), // Amex
      makeCard("37", 15), // Amex
      makeCard("51", 16), // Mastercard 5-series
      makeCard("55", 16), // Mastercard 5-series
      makeCard("2223", 16), // Mastercard 2-series
      makeCard("6011", 16), // Discover
      makeCard("65", 17), // Discover
      makeCard("645", 16), // Discover 644-649
      makeCard("622200", 16), // Discover UnionPay co-brand range
      makeCard("30", 14), // Diners
      makeCard("36", 14), // Diners
      makeCard("38", 14), // Diners
      makeCard("39", 14), // Diners
      makeCard("3528", 16), // JCB
      makeCard("3589", 19), // JCB
      makeCard("62", 16), // UnionPay
    ];
    for (const c of cards) {
      expect(luhn(c)).toBe(true);
      const found = cardDetector.detect(c);
      expect(found).toHaveLength(1);
      expect(found[0]!.type).toBe("CARD");
    }
  });

  it("detects a card with spaces and reports the original span", () => {
    const visa = makeCard("4", 16);
    const spaced = `${visa.slice(0, 4)} ${visa.slice(4, 8)} ${visa.slice(8, 12)} ${visa.slice(12)}`;
    const text = `pay with ${spaced} today`;
    const found = cardDetector.detect(text);
    expect(found).toHaveLength(1);
    expect(found[0]!.value).toBe(spaced);
    expect(text.slice(found[0]!.start, found[0]!.end)).toBe(spaced);
  });

  it("rejects Luhn-invalid numbers", () => {
    expect(cardDetector.detect("4111111111111112")).toHaveLength(0);
  });

  it("rejects unknown prefix / wrong length even when Luhn-valid", () => {
    const unknown = makeCard("9", 16); // no network begins with 9
    expect(luhn(unknown)).toBe(true);
    expect(cardDetector.detect(unknown)).toHaveLength(0);
    expect(cardDetector.detect(makeCard("4", 15))).toHaveLength(0); // Visa is never length 15
  });

  it("ignores short digit runs", () => {
    expect(cardDetector.detect("call 12345 now")).toHaveLength(0);
  });
});
