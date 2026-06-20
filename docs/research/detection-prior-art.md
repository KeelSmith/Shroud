# Research — Detection & reversible-redaction prior art (frozen evidence)

**Date:** 2026-06-17 · **Scope:** the `detectors` design · **Method:** a structured research
pass — multi-source search + source-triangulation + evidence-grading (detection patterns are
reversible implementation specifics, so this is deliberately lightweight).

> **Honesty caveat.** This is **AI-assisted
> research**: a deep-research harness (105 agents, 23 sources fetched, 25 claims
> adversarially verified) followed by **first-hand primary-source reads** by the maintainer to
> close the gaps the harness left inconclusive. Confidence-raising, **not external
> validation.** Every load-bearing claim below carries a source + tier (A = official spec /
> source repo / maintained docs; B = reputable secondary; C = blog/forum). "Inconclusive" is
> recorded honestly where the evidence did not survive. Pin regexes/tables to a source commit
> when porting — upstream drifts.

---

## 1. Detector architecture (Tier A — confirmed 3-0)

Production systems converge on a **per-entity recognizer** = one or more **scored regex
patterns** + an optional **post-match validation hook** (checksum / length / prefix / context
words) that promotes or demotes confidence. Detection is decoupled from confidence.

- Microsoft Presidio: `Pattern(name, regex, score)`; `PatternRecognizer` binds a
  `List[Pattern]` to one entity type; `validate_result()` is an optional hook
  ("e.g., by running checksum") where True → MAX score, False → MIN score, None → unchanged.
- Sources (A): <https://microsoft.github.io/presidio/tutorial/02_regex/>,
  `presidio_analyzer/pattern_recognizer.py`, `…/supported_entities/`.

**Shroud adopts:** a `Detector` per type, each owning its regex(es) + an optional validate
step (Luhn for cards, entropy/anchor for secrets). Mirrors the proven design in TS.

## 2. EMAIL (Tier A — confirmed 3-0)

Adopt the **WHATWG/HTML5 `<input type=email>`** regex (a deliberate "willful violation" of
RFC 5322 — RFC 5322 is "too strict before @, too vague after @, too lax" for practical use):

```
/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
```

- DNS labels start/end alphanumeric, ≤63 chars (RFC 1034 §3.5).
- **Known caveat:** accepts TLD-less addresses like `foo@bar` (whatwg/html#7667). In a
  redaction context we will **require at least one dot in the domain** (a stricter variant)
  to cut false positives, since we are scanning free text, not validating a form field.
- Sources (A): <https://html.spec.whatwg.org/multipage/input.html>,
  <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/email>,
  whatwg/html#1465.

## 3. PHONE (Tier A — confirmed 3-0; important limit)

Full phone validation is **metadata-driven, not regex-only** (libphonenumber: per-territory
`nationalNumberPattern` + `possibleLengths` + leading digits; `isValidNumber` uses length AND
prefix). **A zero-dependency regex approach can only DETECT plausible candidates, not fully
validate.**

**Shroud adopts (best-effort, documented):**
- **NANP** (country code 1): optional `+1`/`1`, area code `[2-9]\d\d`, exchange `[2-9]\d\d`,
  subscriber `\d{4}`, common separators (space, `-`, `.`, `()`).
- **E.164**: `+` followed by 1–3 digit country code and up to 15 total digits.
- Recall is prioritized (redacting a non-phone is safer than leaking a phone), but the area
  code `[2-9]` rule and separators cut the worst false positives.
- Sources (A): <https://github.com/google/libphonenumber>, `PhoneNumberMetadata.xml`,
  <https://github.com/catamphetamine/libphonenumber-js>, Presidio supported_entities.

## 4. CREDIT-CARD (Tier A architecture + Tier B prefix table)

Standard = **regex + Luhn checksum + IIN/BIN prefix + length** (Presidio: 12–19 digits, weak
regex score 0.3 + Luhn in `validate_result`; Google Cloud DLP: "known issuer prefixes,
validates checksums, analyzes character lengths, and considers context"). Tier A:
Presidio `credit_card_recognizer.py`, <https://cloud.google.com/sensitive-data-protection/docs/concepts-infotypes>.

**Per-network IIN/BIN table** (Tier B — <https://en.wikipedia.org/wiki/Payment_card_number>;
pin to a revision when encoding):

| Network | Prefix(es) | Length(s) | Luhn |
|---|---|---|---|
| Visa | `4` | 13, 16, 19 | yes |
| Mastercard | `51`–`55`, `2221`–`2720` | 16 | yes |
| American Express | `34`, `37` | 15 | yes |
| Discover | `6011`, `644`–`649`, `65`, `622126`–`622925` | 16–19 | yes |
| Diners Club | `30`, `36`, `38`, `39` | 14–19 | yes |
| JCB | `3528`–`3589` | 16–19 | yes |
| UnionPay | `62` | 16–19 | yes* |

\* UnionPay is documented as Luhn here, though some UnionPay ranges are known not to satisfy
Luhn in practice; treat Luhn as the primary gate and accept that some UnionPay numbers may be
missed (recorded limit, not a silent assumption).

**Shroud adopts:** candidate = 13–19 digits (optionally separated by single spaces/hyphens);
validate = Luhn AND (length ∈ network set) AND a matching IIN/BIN prefix. Luhn is the cheap
precision win that prevents redacting arbitrary long digit runs.

## 5. API-KEY / SECRET (Tier A — re-sourced first-hand from gitleaks after harness was inconclusive)

The deep-research harness left this area inconclusive (its one secret claim was refuted on
adversarial verification). The maintainer re-read the **current gitleaks ruleset directly**
(`config/gitleaks.toml`, master) — and the refuted OpenAI claim was in fact **substantially
correct**, a useful caution that a verifier's "refute" is not ground truth. Exact patterns (Tier A,
<https://github.com/gitleaks/gitleaks/blob/master/config/gitleaks.toml>):

| Provider | gitleaks rule | Regex (verbatim) | Entropy |
|---|---|---|---|
| OpenAI | `openai-api-key` | `sk-(?:proj\|svcacct\|admin)-(?:[A-Za-z0-9_-]{74}\|[A-Za-z0-9_-]{58})T3BlbkFJ(?:[A-Za-z0-9_-]{74}\|[A-Za-z0-9_-]{58})` and legacy `sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}` | — |
| AWS | `aws-access-token` | `(?:A3T[A-Z0-9]\|AKIA\|ASIA\|ABIA\|ACCA)[A-Z2-7]{16}` | 3 |
| GitHub PAT | `github-pat` | `ghp_[0-9a-zA-Z]{36}` | 3 |
| GitHub fine-grained | `github-fine-grained-pat` | `github_pat_\w{82}` | 3 |
| Google API | `gcp-api-key` | `AIza[\w-]{35}` | 4 |
| Slack bot | `slack-bot-token` | `xoxb-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*` | 3 |
| Stripe | `stripe-access-token` | `(?:sk\|rk)_(?:test\|live\|prod)_[a-zA-Z0-9]{10,99}` | 2 |
| Generic | `generic-api-key` | `key/secret = <value>` with entropy ≥ 3.5 + large stopword/allowlist | 3.5 |

**Shroud adopts (highest-precision first):** the distinctive **prefix-anchored** patterns
above (OpenAI, AWS, GitHub, Google, Slack, Stripe) — these are near-zero false positive
because the prefix + fixed length + (for OpenAI) the `T3BlbkFJ` anchor are unambiguous. The
**generic high-entropy** rule is explicitly **deferred** for the free core: it needs a
stopword/allowlist corpus to hit the zero-false-positive standard (the quality bar), which is
its own unit. Detecting only the distinctive shapes keeps precision high.

## 6. REVERSIBLE redaction / placeholder format (Tier A — re-sourced from LLM Guard)

LLM Guard's `Anonymize` scanner (the closest prior art to Shroud's premise) — Tier A,
`llm_guard/input_scanners/anonymize.py`:

- **Placeholder format:** `f"[REDACTED_{entity_type}_{index}]"` → e.g. `[REDACTED_PERSON_1]`
  (bracketed, underscore-delimited, type + 1-based index).
- **De-dup:** identical values reuse the same index (checks the vault, then a per-batch
  tracker) — "John Smith" twice → `[REDACTED_PERSON_1]` both times.
- **Vault:** stores bidirectional `(placeholder, value)` tuples; deanonymize reverses
  placeholder → original.

**Shroud adopts:** the proven **bracket + underscore + type + index** shape and value-dedup,
**namespaced to Shroud** to lower collision with real text and with LLM-Guard tokens:
**`[SHROUD_<TYPE>_<n>]`** (e.g. `[SHROUD_EMAIL_1]`). Mapping is a serializable
`Record<placeholder, original>` (improvement over an in-memory tuple list — JSON-portable
across the redact-here / send-there / rehydrate-here boundary).

> **INCONCLUSIVE (do not manufacture a verdict):** *which* token format best survives an LLM
> round-trip (model echoes it back unchanged vs. mangles/normalizes/translates it) has **no
> surviving empirical evidence** in this pass. Both Presidio's `<ENTITY>` angle-bracket and
> LLM Guard's `[REDACTED_…]` bracket forms exist; neither is proven superior for round-trip
> survival. **Plan:** choose the LLM-Guard-shaped bracket form on prior-art grounds, and
> **validate survival empirically with a real-host LLM smoke test** (a real-host smoke) in the
> wrappers/publish unit — "swallowed/mangled placeholder" is a finding, not a pass.

## 7. Where a zero-dependency TS library improves on prior art (Tier A synthesis)

- **Zero runtime deps / tiny bundle** vs Presidio (Python + NER) and libphonenumber
  (~550 kB; libphonenumber-js ~145 kB).
- **Reversible round-trip as a first-class, property-tested guarantee** with a
  **serializable** mapping (vs LLM Guard's in-process tuple vault).
- **Deterministic value-dedup** (same value → same placeholder) ported to TS.
- **Drop-in SDK wrappers** (`openai`, `@anthropic-ai/sdk`, `ai`) — the integration layer
  prior-art detection engines don't ship.

---

## Open questions carried forward (for later units / future research)

1. **Placeholder round-trip survival** — empirically test which token format real models echo
   back unchanged (validate in the wrappers/publish unit via a live smoke).
2. **Generic high-entropy secret detection** — needs a must-allow stopword/allowlist corpus
   before it can ship at zero-false-positive precision (own unit, deferred).
3. **Card IIN/BIN drift** — pin the prefix table to a dated source; ranges evolve.
4. **Presidio/LLM Guard internals** — re-confirm against current repos if we deepen the
   anonymizer parity (the harness's second-hand claims here were refuted; only first-hand
   reads above are trusted).
