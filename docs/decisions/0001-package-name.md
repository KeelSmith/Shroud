---
status: accepted
date: 2026-06-17
significance: tier-1
supersedes: none
superseded-by: none
provenance: maintainer recommendation, 2026-06-17, unit "scaffold" — accepted 2026-06-18 (publish-polish)
---

# ADR-0001 — npm package name: `shroud-ai`

## Context — the forces at play

The project's working/display name is "Shroud" and its repository folder is `shroud`. For a
publishable npm package the name must be available on the public registry. Verified at
2026-06-17:

- `npm view shroud version` → `0.6.1` (the name **`shroud` is already taken**).
- `npm view shroud-ai version` → `npm error 404 ... Not Found` (the name **`shroud-ai` is
  available**).

## Decision

Publish the package as **`shroud-ai`**. Keep "Shroud" as the human-facing display name and
`shroud` as the repository folder name. Use `shroud-ai/openai`, `shroud-ai/anthropic`, and
`shroud-ai/ai` as the wrapper subpath exports.

> **Status `proposed` — pending operator lock.** The maintainer recommends; the operator locks.
> Tracked as REC-A in `MEMORY.md`.

## Rationale & rejected alternatives

- **`shroud-ai` (chosen):** available, communicates the AI focus, keeps the brand word.
- *Rejected — `shroud`:* unavailable on npm.
- *Rejected — a scoped name `@<user>/shroud`:* ties the package to a personal/org scope and
  adds friction for unscoped discovery; unnecessary given an unscoped name is free.
- *Rejected — an unrelated coined word:* loses the established "Shroud" brand for no gain.

## Consequences

- Easier: the package can be published unscoped and discovered by its `-ai` suffix.
- Harder: a tiny brand split (folder `shroud` vs package `shroud-ai`) the README must state
  clearly. Documented in README and `package.json`.

## Enforcement link

Mechanical: `package.json#name` is `shroud-ai` and `npm publish --dry-run` resolves the name;
a name collision would fail publish. Judgment-layer: brand choice is the operator's to lock.

## Context-notes (dated, additive only)
