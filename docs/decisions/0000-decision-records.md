---
status: accepted
date: 2026-06-17
significance: tier-1
supersedes: none
superseded-by: none
provenance: operator commission + maintainer ignition, 2026-06-17, unit "scaffold"
---

# ADR-0000 — How Shroud records decisions

## Context — the forces at play

Shroud is built to a senior-team quality bar from commit #1. That standard calls for an ADR
system *before the first source commit*: a `docs/decisions/` directory, `NNNN-kebab` filenames
whose numbers are never reused, mandatory evidence anchors, and a governing meta-record. This
is that meta-record.

## Decision

- Architecturally significant (tier-1) decisions are recorded here as ADRs carrying a 9-facet
  record (decision · context/forces · rationale + rejected alternatives · consequences · status
  · provenance · supersession links · significance · enforcement link).
- Files are named `NNNN-kebab-case-title.md`. **Numbers are never reused**; gaps are normal
  (count files, not the max number).
- Frontmatter carries `status` (`proposed | accepted | superseded-by NNNN | deprecated`),
  `date`, `significance`, `supersedes`/`superseded-by` (bidirectional), and `provenance`.
- **Accepted ADRs are never rewritten.** Premise changes land as dated, additive
  Context-notes; supersession is bidirectional.
- Each tier-1 ADR names its **enforcement link** (the check that holds it, or an explicit
  "judgment-layer review question").
- The significance bar (the quality bar) decides what earns a record at all: tier-1 →
  full ADR + a `MEMORY.md` line; tier-2 → one `MEMORY.md` line; tier-3 → no record.

## Rationale & rejected alternatives

- **Nygard-style ADRs (chosen):** the convergent industry standard for capturing the *why*
  of a decision, including rejected branches a future reader cannot reconstruct from the
  verdict. This is a convergent best practice.
- *Rejected — decisions only in commit messages / PR descriptions:* not discoverable, not
  indexed, and lost to anyone reading the repo cold.
- *Rejected — a single growing DECISIONS.md:* becomes an unscannable archive; per-file ADRs
  with stable numbers are linkable and supersession-aware.

## Consequences

- Easier: a successor (human or AI) can reconstruct why a choice was made and what was
  rejected; supersession keeps history honest.
- Harder: every significant decision costs a file. The significance bar keeps that cost
  proportionate by *not* recording tier-3 work.

## Enforcement link

Judgment-layer: whether a decision is "architecturally significant" is a review question
(the quality bar), not mechanizable. The mechanical parts that *can* be checked — template
present, filenames `NNNN-kebab`, frontmatter fields present — are verified at each gate and
are candidates for a future `docs:check` lint (graduation trigger the quality bar once a
record drifts). Until then, carried as a review question.

## Context-notes (dated, additive only)
