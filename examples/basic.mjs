// Shroud — basic redact/rehydrate round-trip (no network).
// Run after building the package:
//   npm run build && node examples/basic.mjs
import { redact, rehydrate } from "../dist/index.js";

const original = "Email jane@acme.com or call 415-555-0132.";

const { text, mapping } = redact(original);
console.log("original: ", original);
console.log("redacted: ", text);
console.log("mapping:  ", mapping);

// Pretend an AI model replied, echoing the placeholders back verbatim:
const placeholders = Object.keys(mapping);
const modelReply = `Done — I contacted ${placeholders.join(" and ")}.`;

const restored = rehydrate(modelReply, mapping);
console.log("ai reply: ", modelReply);
console.log("restored: ", restored);

// The originals are back, and the model never saw them.
if (!restored.includes("jane@acme.com") || !restored.includes("415-555-0132")) {
  throw new Error("round-trip failed");
}
console.log("\nOK — round-trip restored the originals.");
