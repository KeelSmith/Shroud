import { describe, it, expect } from "vitest";
import { luhn } from "../../src/detectors/luhn.js";

describe("luhn", () => {
  it("accepts Luhn-valid numbers", () => {
    expect(luhn("4111111111111111")).toBe(true);
    expect(luhn("79927398713")).toBe(true); // classic Luhn worked example
  });

  it("rejects invalid checksums", () => {
    expect(luhn("4111111111111112")).toBe(false);
    expect(luhn("79927398710")).toBe(false);
  });

  it("rejects empty and non-digit input", () => {
    expect(luhn("")).toBe(false);
    expect(luhn("4111-1111")).toBe(false);
    expect(luhn("abc")).toBe(false);
  });
});
