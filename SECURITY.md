# Security Policy

## Scope & honest posture

Shroud reduces the chance that sensitive values reach a third-party AI provider by detecting
and replacing them with placeholders. **It is a risk-reduction tool, not a guarantee.**
Detection is best-effort pattern matching: novel formats, obfuscated values, or sensitive
data Shroud does not model (names, addresses, medical text, etc.) may pass through. Treat the
redacted output as something to **review against your own threat model**, not as certified
clean.

Shroud has **zero network access and zero runtime dependencies** in its core — it never
phones home and nothing leaves your process except the text you pass to your own AI client.

## Supported versions

Pre-1.0: only the latest published version is supported. Once 1.0 ships, this section will
state the supported range.

## Reporting a vulnerability

Please report suspected vulnerabilities **privately**, not via a public issue:

1. Use GitHub's **private vulnerability reporting** ("Report a vulnerability" under the
   repository's Security tab), or
2. Email the maintainers at the address listed on the repository's profile.

Include a description, affected versions, and a minimal reproduction. We aim to acknowledge
within a few business days and to coordinate a fix and disclosure timeline with you.

Please do not publicly disclose the issue until a fix is available.
