import { describe, it, expect } from "vitest";
import { DEFAULT_DETECTORS, detectAll } from "../../src/detectors/detect.js";
import { phoneDetector } from "../../src/detectors/phone.js";

describe("DEFAULT_DETECTORS", () => {
  it("is the canonical ordered set: EMAIL, SECRET, CARD, PHONE", () => {
    expect(DEFAULT_DETECTORS.map((d) => d.type)).toEqual(["EMAIL", "SECRET", "CARD", "PHONE"]);
  });
});

describe("detectAll", () => {
  it("returns position-ordered, non-overlapping matches across types", () => {
    const text = "mail a@b.com or card 4111111111111111 or call 415-555-0132";
    const found = detectAll(text);
    expect(found.map((m) => m.type)).toEqual(["EMAIL", "CARD", "PHONE"]);
    const starts = found.map((m) => m.start);
    expect([...starts].sort((x, y) => x - y)).toEqual(starts);
  });

  it("classifies a Luhn-valid 16-digit run as CARD (precedence over PHONE)", () => {
    const num = "5555555555554444"; // Mastercard test number, Luhn-valid
    // PHONE alone would match the leading 10 digits...
    expect(phoneDetector.detect(num).length).toBeGreaterThan(0);
    // ...but the aggregator resolves the overlap in CARD's favor.
    const found = detectAll(num);
    expect(found).toHaveLength(1);
    expect(found[0]!.type).toBe("CARD");
  });

  it("honors a custom detector subset", () => {
    const onlyEmail = DEFAULT_DETECTORS.filter((d) => d.type === "EMAIL");
    const found = detectAll("a@b.com and 4111111111111111", onlyEmail);
    expect(found.map((m) => m.type)).toEqual(["EMAIL"]);
  });

  it("returns nothing for clean text", () => {
    expect(detectAll("nothing sensitive to see here")).toHaveLength(0);
  });
});
