// Shroud — REAL-LLM placeholder-survival smoke (see ADR-0002).
//
// Verifies that a real model echoes the [SHROUD_*] placeholders back intact so `rehydrate`
// restores the originals — i.e. the sensitive values never reached the provider, yet the
// final answer reads correctly. Run by the OPERATOR (it makes a real, paid API call):
//
//   npm run build
//   npm i openai            &&  OPENAI_API_KEY=sk-...     node examples/smoke-llm.mjs
//   # or
//   npm i @anthropic-ai/sdk &&  ANTHROPIC_API_KEY=sk-...  node examples/smoke-llm.mjs
//
// Exit code: 0 = PASS (survived), 1 = FAIL (model altered the tokens), 2 = no key, 3 = error.
import { wrapOpenAI } from "../dist/wrappers/openai.js";
import { wrapAnthropic } from "../dist/wrappers/anthropic.js";

const SENSITIVE = { email: "jane@acme.com", phone: "415-555-0132" };
const prompt =
  `Reply with EXACTLY this sentence and copy any bracketed tokens verbatim: ` +
  `"Please contact ${SENSITIVE.email} or call ${SENSITIVE.phone}."`;

function report(reply) {
  const survived = reply.includes(SENSITIVE.email) && reply.includes(SENSITIVE.phone);
  console.log("\nrehydrated model reply:\n  " + reply);
  if (survived) {
    console.log("\nPASS — placeholders survived the round-trip and rehydrated to the originals.");
    process.exit(0);
  }
  console.log("\nFAIL — originals were not fully restored; the model likely altered the placeholders.");
  process.exit(1);
}

async function main() {
  if (process.env.OPENAI_API_KEY) {
    const { default: OpenAI } = await import("openai");
    const client = wrapOpenAI(new OpenAI());
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    report(res.choices?.[0]?.message?.content ?? "");
  } else if (process.env.ANTHROPIC_API_KEY) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = wrapAnthropic(new Anthropic());
    const res = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (res.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    report(text);
  } else {
    console.error(
      "No API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY and install the matching SDK " +
        "(npm i openai  |  npm i @anthropic-ai/sdk).",
    );
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(3);
});
