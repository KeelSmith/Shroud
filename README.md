# Shroud

**One-line PII & secret redaction for your AI SDK calls — redact on the way out, rehydrate on the way back.**

`shroud-ai` wraps your existing **OpenAI / Anthropic / Vercel AI** client so sensitive values
(emails, phone numbers, credit cards, API keys) are stripped out *before* a request leaves your
process and restored in the model's reply — with **one line of code**, **zero runtime
dependencies**, and **no Python sidecar or hosted service**. Pure TypeScript, runs in-process,
MIT-licensed.

The redaction primitive isn't novel (see [How it compares](#how-it-compares)); the point is the
**drop-in ergonomics** — wrap your client, change nothing else, and your PII never reaches the
provider.

> **Status:** pre-1.0 — the API below is **implemented and tested** (detection, `redact`/
> `rehydrate`, and the three SDK wrappers). Minor changes are still possible before 1.0; see
> [CHANGELOG.md](./CHANGELOG.md).

## Why

Sending raw user text to a third-party model can leak PII and secrets into logs, training
pipelines, and prompt history. Shroud lets you keep the convenience of plain-text prompts
while the values that matter never reach the provider:

```text
You → Shroud → AI provider → Shroud → You
       redact                 rehydrate
```

## Install

```sh
npm install shroud-ai
```

## Quick start

```ts
import { redact, rehydrate } from "shroud-ai";

const original = "Email jane@acme.com or call 415-555-0132.";

const { text, mapping } = redact(original);
// text === "Email [SHROUD_EMAIL_1] or call [SHROUD_PHONE_1]."

// ...send `text` to your AI model, get a reply that echoes the placeholders...
const modelReply = `I've emailed [SHROUD_EMAIL_1] and called [SHROUD_PHONE_1].`;

const restored = rehydrate(modelReply, mapping);
// restored === "I've emailed jane@acme.com and called 415-555-0132."
```

## What it detects

| Type | Placeholder | Notes |
|---|---|---|
| Email addresses | `[SHROUD_EMAIL_n]` | WHATWG/HTML5 pragmatic matcher (dotted domain required) |
| Phone numbers | `[SHROUD_PHONE_n]` | North-American & E.164-style formats (best-effort) |
| Credit-card numbers | `[SHROUD_CARD_n]` | 13–19 digits, **Luhn + IIN/BIN-validated** to cut false positives |
| API keys / secrets | `[SHROUD_SECRET_n]` | distinctive provider key prefixes (OpenAI, AWS, GitHub, Google, Slack, Stripe) |

Detection is deterministic: the same value always maps to the same placeholder within a
single `redact()` call, so a value that appears twice is redacted once and rehydrates
everywhere.

## Drop-in wrappers for AI SDKs

Shroud ships thin wrappers so you can protect existing code without restructuring it. The
SDKs are **optional peer dependencies** — install only the one(s) you use.

### OpenAI

```ts
import OpenAI from "openai";
import { wrapOpenAI } from "shroud-ai/openai";

const client = wrapOpenAI(new OpenAI());

const res = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Email jane@acme.com a summary." }],
});
// outgoing message is redacted; res content is rehydrated for you
```

### Anthropic

```ts
import Anthropic from "@anthropic-ai/sdk";
import { wrapAnthropic } from "shroud-ai/anthropic";

const client = wrapAnthropic(new Anthropic());

const res = await client.messages.create({
  model: "claude-haiku-4-5",
  max_tokens: 256,
  messages: [{ role: "user", content: "Call 415-555-0132 and confirm." }],
});
```

### Vercel AI SDK

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { withShroud } from "shroud-ai/ai";

const { text } = await withShroud(generateText)({
  model: openai("gpt-4o-mini"),
  prompt: "Draft a reply to jane@acme.com.",
});
```

## API

- `redact(text: string, options?: RedactOptions): RedactResult` — returns `{ text, mapping }`.
  `options.types?: DetectionType[]` restricts which detectors run (default: all four).
- `rehydrate(text: string, mapping: Mapping): string` — restores originals from placeholders;
  unknown placeholders are left untouched.
- `Mapping` is a plain `Record<placeholder, original>` — JSON-serializable, so you can store
  it or pass it alongside the request and rehydrate the reply elsewhere.
- `wrapOpenAI`, `wrapAnthropic`, `withShroud` — SDK wrappers (subpath exports).

Restrict detection:

```ts
redact("email a@b.com, call 415-555-0132", { types: ["EMAIL"] });
// only the email is redacted; the phone number is left as-is
```

See the [public-API contract](./docs/contracts/0001-redaction-interface.md) and
[docs/decisions/0002-redaction-architecture.md](./docs/decisions/0002-redaction-architecture.md)
for the spec and design rationale.

## Behavior & limits

- **Reversible round-trip:** `rehydrate(redact(t).text, redact(t).mapping) === t` for any input
  that doesn't already contain a placeholder token (property-tested; see the edge case below).
- **Not a security boundary on its own.** Detection is best-effort pattern matching; it
  reduces exposure, it does not guarantee zero leakage. Review the redacted text for your
  threat model. See [SECURITY.md](./SECURITY.md).
- **Literal-token edge case:** if your input already contains a `[SHROUD_<TYPE>_<n>]` token,
  exact round-trip isn't guaranteed for that token (vanishingly rare in real prompts).
- **Phone detection is best-effort** (regex, not full libphonenumber validation), and the
  free core detects only the **distinctive** API-key shapes — generic high-entropy secrets are
  out of scope for now.

## How it compares

The reversible redact-then-rehydrate pattern and local TypeScript redaction **already exist** in
the ecosystem — Shroud's distinct edge is the **drop-in SDK wrappers** (wrap your client, change
nothing else) plus running fully in-process with **no Python sidecar**.

| | Shroud | openredaction / pii-vault | hai-guardrails | Presidio / LLM Guard |
|---|---|---|---|---|
| Language | TypeScript | TypeScript | TypeScript | Python |
| Runs in your Node process | ✅ | ✅ | ✅ | ❌ (Docker / REST sidecar) |
| Reversible (rehydrates the reply) | ✅ | ✅ | ❌ (one-way) | ✅ (LLM Guard) |
| Drop-in `openai`/`anthropic`/`ai` wrappers | ✅ | ❌ | ❌ | ❌ |
| Runtime dependencies | none | none | some | heavy |

Honest take: if you need the broadest PII coverage (names, addresses via ML/NER), reach for
**Presidio**. If you want a zero-dependency TypeScript library that wraps your AI client in one
line and restores the reply, that's **Shroud**. There's also **Rehydra**, a local *proxy* that
redacts traffic from tools like Claude Code/Cursor — a different shape (a gateway, not a library).

## Feedback

Shroud is new and we're listening. If you're using it — or looked and chose not to — please tell
us in a [GitHub issue](../../issues): what you're building, which SDK, and whether a hosted or
compliance-focused version would help. It genuinely shapes the roadmap.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). This project is built to a senior-team quality bar
from commit #1.

## Acknowledgements

Detection patterns were **informed by** (not copied from) gitleaks (MIT), the WHATWG HTML email
spec, and Microsoft Presidio (MIT). See [NOTICE](./NOTICE) and
[docs/research/detection-prior-art.md](./docs/research/detection-prior-art.md); no third-party
code is vendored.

## License

[MIT](./LICENSE) © The Shroud Authors
