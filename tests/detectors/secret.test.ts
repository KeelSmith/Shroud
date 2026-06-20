import { describe, it, expect } from "vitest";
import { secretDetector } from "../../src/detectors/secret.js";

// Fixtures are assembled from parts so no full real-looking key literal is committed
// (keeps the secret-scanner happy); the concatenated value still matches the detector.
const cat = (...parts: string[]): string => parts.join("");

describe("secretDetector", () => {
  it("detects distinctive provider key shapes", () => {
    const samples = [
      cat("sk-", "A".repeat(20), "T3Blbk", "FJ", "B".repeat(20)), // OpenAI (legacy)
      cat("AKIA", "ABCDEFGHIJKLMNOP"), // AWS access key id
      cat("ghp_", "a".repeat(36)), // GitHub PAT
      cat("github_pat_", "b".repeat(82)), // GitHub fine-grained
      cat("AIza", "c".repeat(35)), // Google API key
      cat("xoxb-", "1234567890", "-", "0987654321", "abcXYZ"), // Slack bot token
      cat("sk", "_", "live", "_", "abcdEFGH1234"), // Stripe secret key
    ];
    for (const s of samples) {
      const found = secretDetector.detect(`token=${s} end`);
      expect(found.map((m) => m.value)).toContain(s);
      expect(found.every((m) => m.type === "SECRET")).toBe(true);
    }
  });

  it("detects an OpenAI project key (T3BlbkFJ-anchored)", () => {
    const key = cat("sk-proj-", "a".repeat(74), "T3Blbk", "FJ", "b".repeat(74));
    expect(secretDetector.detect(key)).toHaveLength(1);
  });

  it("does not match near-misses or ordinary text", () => {
    expect(secretDetector.detect(cat("sk-", "tooshort"))).toHaveLength(0);
    expect(secretDetector.detect("AKIA")).toHaveLength(0);
    expect(secretDetector.detect("just a normal sentence with several words")).toHaveLength(0);
  });
});
