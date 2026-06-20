# Privacy

Shroud (`shroud-ai`) is a local library. Its core:

- **Collects no telemetry.** There is no analytics, no phone-home, no usage tracking.
- **Makes no network calls.** The core `redact` / `rehydrate` functions are pure and run
  entirely in your process.
- **Stores nothing.** Mappings produced by `redact()` are returned to you as ordinary
  in-memory values; Shroud does not persist them anywhere.

The optional SDK wrappers (`shroud-ai/openai`, `shroud-ai/anthropic`, `shroud-ai/ai`) call
**your** configured AI provider through **your** SDK client — Shroud adds no destinations of
its own. The redacted text is what gets sent; the original sensitive values stay in the
mapping in your process and are only re-inserted locally when you call `rehydrate()`.

Because Shroud never sees your data leave your machine, there is nothing for Shroud to
retain, share, or sell.
