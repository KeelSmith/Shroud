import { describe, it, expect } from "vitest";
import { phoneDetector } from "../../src/detectors/phone.js";

const vals = (s: string): string[] => phoneDetector.detect(s).map((m) => m.value);

describe("phoneDetector", () => {
  it("detects common NANP formats", () => {
    expect(vals("call 415-555-0132")).toContain("415-555-0132");
    expect(vals("call (415) 555-0132")).toContain("(415) 555-0132");
    expect(vals("call 415.555.0132")).toContain("415.555.0132");
    expect(vals("call +1 415 555 0132")).toContain("+1 415 555 0132");
  });

  it("detects E.164", () => {
    expect(vals("ring +442071838750 now")).toContain("+442071838750");
  });

  it("dedupes when E.164 and NANP match the same span", () => {
    expect(phoneDetector.detect("+14155550132")).toHaveLength(1);
  });

  it("ignores clearly non-phone text", () => {
    expect(phoneDetector.detect("the year 2026 was fine")).toHaveLength(0);
    expect(phoneDetector.detect("id 42 and 999")).toHaveLength(0);
  });
});
