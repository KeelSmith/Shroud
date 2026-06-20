import { describe, it, expect } from "vitest";
import { redact } from "../src/redact.js";
import { rehydrate } from "../src/rehydrate.js";

describe("rehydrate", () => {
  it("restores a redacted string exactly", () => {
    const original = "Email jane@acme.com or call 415-555-0132.";
    const { text, mapping } = redact(original);
    expect(rehydrate(text, mapping)).toBe(original);
  });

  it("restores every occurrence of a deduped value", () => {
    const original = "a@b.com and a@b.com again";
    const { text, mapping } = redact(original);
    expect(rehydrate(text, mapping)).toBe(original);
  });

  it("leaves unknown placeholders untouched and is a no-op with an empty mapping", () => {
    expect(rehydrate("see [SHROUD_EMAIL_9] here", {})).toBe("see [SHROUD_EMAIL_9] here");
    expect(rehydrate("plain text", {})).toBe("plain text");
  });

  it("restores a model reply that echoes the placeholders", () => {
    const { mapping } = redact("Email jane@acme.com");
    const reply = "I emailed [SHROUD_EMAIL_1] just now.";
    expect(rehydrate(reply, mapping)).toBe("I emailed jane@acme.com just now.");
  });
});
