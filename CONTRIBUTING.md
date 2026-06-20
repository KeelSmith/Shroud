# Contributing to Shroud

Thanks for your interest in Shroud (`shroud-ai`). This project is built to the standard a
**senior engineering team** would produce, from commit #1. This document describes how to work
in it.

> Solo-maintainer honesty: Shroud is currently maintained by a single maintainer. The
> conventions below are real and enforced; the contributor base is small.

## Quality bar

- Documentation matches code reality. Out-of-date docs are a finding.
- Every artifact is complete-within-scope when it ships — no stubs, no `TODO: fill in`.
- Every rule has a mechanical enforcement mechanism (lint / typecheck / test / CI).
- Convergent ecosystem conventions by default; divergence requires a recorded reason.

## Development setup

Requirements: **Node >= 20** and **npm**.

```sh
git clone <repo-url> shroud
cd shroud
npm install
npm run build       # tsc -> dist/
npm test            # vitest, with coverage thresholds
npm run lint        # eslint
npm run typecheck   # tsc --noEmit over src + tests
```

## Workflow for a change

1. **Open an issue** describing the change (bug or feature) before substantial work.
2. **Branch** from `main`.
3. **Implement** the change with a clear, single focus.
4. **Write/update tests** for every behavior change; keep coverage above the configured bar.
5. **Run the checks locally:** `npm run lint`, `npm run typecheck`, `npm run build`,
   `npm run test:coverage` (all green).
6. **Open a PR** with a Conventional-Commits title and a description of what changed and why.

## Commit messages

Shroud follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/),
enforced by `commitlint` via the `commit-msg` hook and in CI. Allowed types: `feat`, `fix`,
`docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`. Use `<type>!:` or a
`BREAKING CHANGE:` footer for breaking changes.

```
feat(detectors): add Luhn-validated credit-card detector

Closes #NN
```

## Decision records

Architecturally significant decisions are recorded as ADRs in
[`docs/decisions/`](./docs/decisions/), each carrying a 9-facet record (decision, context,
rationale + rejected alternatives, consequences, status, provenance, supersession links,
significance, enforcement link). Accepted ADRs are never rewritten — premise changes land as
dated additive Context-notes.

## Reporting bugs & security issues

- **Bugs / features:** open a GitHub issue with a minimal reproduction.
- **Security:** do **not** open a public issue — see [SECURITY.md](./SECURITY.md).

## Code of Conduct

This project adopts the [Contributor Covenant](./CODE_OF_CONDUCT.md). All interactions are
expected to follow it.
