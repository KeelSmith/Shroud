# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] — 2026-06-20

### Fixed
- Raised the supported Node floor to **>=20** and dropped Node 18 from the CI matrix: the dev
  toolchain (Vitest 4, ESLint 10) requires Node 20+, and Node 18 is end-of-life. (CI on Node 18
  failed; Node 20 and 22 pass.)

## [0.1.0] — 2026-06-18

First public release of the free core.

### Added
- Honest competitive positioning in the README (drop-in SDK-wrapper ergonomics / "no Python
  sidecar"; a "How it compares" table) + a feedback channel (issue templates, README CTA).
- `NOTICE` + README acknowledgements crediting gitleaks / WHATWG / Presidio for pattern sourcing.
- ReDoS/perf guard (`tests/redos.test.ts`); **fixed** the email detector's quadratic
  backtracking on large no-`@` inputs (leading negative lookbehind).
- Publish metadata: `repository` / `homepage` / `bugs` / `publishConfig` (npm page links to
  source); `detectAll` overlap resolution made O(n log n).
- Project scaffolding to a senior-team day-one standard: community-health files,
  hygiene files, TypeScript + npm toolchain, ESLint, Vitest with coverage thresholds, CI,
  and the ADR system.
- Decision records: `0000` (decision-record system), `0001` (npm package name `shroud-ai`),
  `0002` (reversible redaction architecture), `0003` (detection-layer design & pattern sourcing).
- Researched prior-art evidence (`docs/research/detection-prior-art.md`) anchoring the design.
- **Detection layer** (`src/detectors/`): email (WHATWG, dotted-domain), best-effort phone
  (NANP + E.164), credit-card (Luhn + IIN/BIN, 13–19 digits), and prefix-anchored API-key/secret
  detectors (OpenAI/AWS/GitHub/Google/Slack/Stripe), plus a precedence-resolving `detectAll`
  aggregator. Pure, zero-dependency; 23 unit tests.
- **Redaction core** (`redact()` / `rehydrate()`): reversible `[SHROUD_<TYPE>_<n>]` placeholder
  substitution with value-dedup and a JSON-serializable mapping; public entry point
  `src/index.ts`; public-API contract `docs/contracts/0001-redaction-interface.md`.
  Property-tested round-trip (`fast-check`). Now 37 tests.

- **Drop-in SDK wrappers**: `wrapOpenAI` / `wrapAnthropic` (Proxy that intercepts only the
  `create` method) and `withShroud` for the Vercel AI SDK (`shroud-ai/openai`,
  `shroud-ai/anthropic`, `shroud-ai/ai`). Each redacts request text and rehydrates the reply
  under one shared mapping; zero runtime deps (SDKs are optional peers). Decision: ADR-0004.
- Runnable `examples/` — `basic.mjs` (network-free round-trip) and `smoke-llm.mjs` (the
  real-LLM placeholder-survival smoke). README reconciled to the shipped API.
- Decision records `0001`–`0004` and contract `0001` accepted; verified the publish tarball
  ships only `dist/ + LICENSE + README + CHANGELOG`. 56 tests; coverage 95%+ / 90%+ branch.
