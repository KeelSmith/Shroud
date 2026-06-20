import { describe, it, expect } from "vitest";
import { redactStrings } from "../../src/wrappers/internal.js";
import { interceptMethod } from "../../src/wrappers/proxy.js";

describe("redactStrings", () => {
  it("returns empty for no input", () => {
    expect(redactStrings([])).toEqual({ redacted: [], mapping: {} });
  });

  it("shares one mapping across strings (dedup + per-type numbering)", () => {
    const { redacted, mapping } = redactStrings(["mail a@b.com", "again a@b.com", "other c@d.com"]);
    expect(redacted).toEqual([
      "mail [SHROUD_EMAIL_1]",
      "again [SHROUD_EMAIL_1]",
      "other [SHROUD_EMAIL_2]",
    ]);
    expect(mapping["[SHROUD_EMAIL_1]"]).toBe("a@b.com");
    expect(mapping["[SHROUD_EMAIL_2]"]).toBe("c@d.com");
  });

  it("rejects NUL input loudly", () => {
    expect(() => redactStrings(["x" + String.fromCharCode(0) + "y"])).toThrow(/NUL/);
  });
});

describe("interceptMethod", () => {
  it("forwards a property when a path segment is not an object", () => {
    const obj = { a: 5 };
    const wrapped = interceptMethod(obj as object, ["a", "b", "c"], (o) => o);
    expect((wrapped as { a: number }).a).toBe(5);
  });
});
