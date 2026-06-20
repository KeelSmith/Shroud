import { describe, it, expect } from "vitest";
import { redact } from "../src/redact.js";
import * as api from "../src/index.js";

describe("redact", () => {
  it("replaces detected values with placeholders and maps them back", () => {
    const { text, mapping } = redact("Email jane@acme.com or call 415-555-0132.");
    expect(text).toBe("Email [SHROUD_EMAIL_1] or call [SHROUD_PHONE_1].");
    expect(mapping["[SHROUD_EMAIL_1]"]).toBe("jane@acme.com");
    expect(mapping["[SHROUD_PHONE_1]"]).toBe("415-555-0132");
  });

  it("dedupes a repeated value to a single placeholder", () => {
    const { text, mapping } = redact("from a@b.com to a@b.com");
    expect(text).toBe("from [SHROUD_EMAIL_1] to [SHROUD_EMAIL_1]");
    expect(Object.keys(mapping)).toEqual(["[SHROUD_EMAIL_1]"]);
  });

  it("counts per type in order of first appearance", () => {
    const { mapping } = redact("a@x.com then b@y.com");
    expect(mapping["[SHROUD_EMAIL_1]"]).toBe("a@x.com");
    expect(mapping["[SHROUD_EMAIL_2]"]).toBe("b@y.com");
  });

  it("honors options.types (only the requested types are redacted)", () => {
    const { text } = redact("a@b.com and 415-555-0132", { types: ["EMAIL"] });
    expect(text).toContain("[SHROUD_EMAIL_1]");
    expect(text).toContain("415-555-0132");
  });

  it("detects nothing when options.types is empty", () => {
    const r = redact("a@b.com", { types: [] });
    expect(r.text).toBe("a@b.com");
    expect(r.mapping).toEqual({});
  });

  it("returns input unchanged when nothing is detected", () => {
    const r = redact("nothing sensitive here");
    expect(r.text).toBe("nothing sensitive here");
    expect(r.mapping).toEqual({});
  });

  it("is deterministic and produces a JSON-serializable mapping", () => {
    const a = redact("ping jane@acme.com");
    const b = redact("ping jane@acme.com");
    expect(a).toEqual(b);
    expect(JSON.parse(JSON.stringify(a.mapping)) as unknown).toEqual(a.mapping);
  });

  it("exposes the documented public surface from the barrel", () => {
    expect(typeof api.redact).toBe("function");
    expect(typeof api.rehydrate).toBe("function");
    expect(typeof api.detectAll).toBe("function");
    expect(Array.isArray(api.DEFAULT_DETECTORS)).toBe(true);
  });
});
