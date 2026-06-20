import { describe, it, expect } from "vitest";
import { emailDetector } from "../../src/detectors/email.js";

const vals = (s: string): string[] => emailDetector.detect(s).map((m) => m.value);

describe("emailDetector", () => {
  it("detects an address and reports its exact span", () => {
    const text = "ping jane.doe+tag@sub.example.co.uk please";
    const found = emailDetector.detect(text);
    expect(found).toHaveLength(1);
    expect(found[0]!.value).toBe("jane.doe+tag@sub.example.co.uk");
    expect(text.slice(found[0]!.start, found[0]!.end)).toBe("jane.doe+tag@sub.example.co.uk");
    expect(found[0]!.type).toBe("EMAIL");
  });

  it("requires a dotted domain (rejects TLD-less)", () => {
    expect(emailDetector.detect("user@localhost")).toHaveLength(0);
    expect(emailDetector.detect("foo@bar")).toHaveLength(0);
  });

  it("detects multiple addresses", () => {
    expect(vals("a@x.com, b@y.org")).toEqual(["a@x.com", "b@y.org"]);
  });
});
