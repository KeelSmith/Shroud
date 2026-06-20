/* Vercel AI SDK adapter. Wraps the untyped generateText surface — see ADR-0004; unsafe-* lint scoped-off. */
import type { RedactOptions } from "../types.js";
import { redactStrings, rehydrate } from "./internal.js";

function isTextPart(part: any): boolean {
  return typeof part === "object" && part !== null && part.type === "text" && typeof part.text === "string";
}

function collectFromMessages(messages: any[]): string[] {
  const out: string[] = [];
  for (const msg of messages) {
    const content = msg?.content;
    if (typeof content === "string") out.push(content);
    else if (Array.isArray(content)) for (const part of content) if (isTextPart(part)) out.push(part.text);
  }
  return out;
}

function collect(params: any): string[] {
  const out: string[] = [];
  if (typeof params?.system === "string") out.push(params.system);
  if (typeof params?.prompt === "string") out.push(params.prompt);
  else if (Array.isArray(params?.prompt)) out.push(...collectFromMessages(params.prompt));
  if (Array.isArray(params?.messages)) out.push(...collectFromMessages(params.messages));
  return out;
}

function rebuildMessages(messages: any[], next: () => string): any[] {
  return messages.map((msg) => {
    const content = msg?.content;
    if (typeof content === "string") return { ...msg, content: next() };
    if (Array.isArray(content)) {
      return {
        ...msg,
        content: content.map((part) => (isTextPart(part) ? { ...part, text: next() } : part)),
      };
    }
    return msg;
  });
}

function rebuild(params: any, redacted: string[]): any {
  let i = 0;
  const next = (): string => redacted[i++] as string; // aligned 1:1 with collect()
  const out: any = { ...params };
  if (typeof params?.system === "string") out.system = next();
  if (typeof params?.prompt === "string") out.prompt = next();
  else if (Array.isArray(params?.prompt)) out.prompt = rebuildMessages(params.prompt, next);
  if (Array.isArray(params?.messages)) out.messages = rebuildMessages(params.messages, next);
  return out;
}

/**
 * Wrap the Vercel AI SDK's `generateText` (or any call with the same shape) so it redacts
 * `system` / `prompt` / `messages` text on the way out and rehydrates `result.text` on the
 * way back. The SDK is an optional peer — this never imports `ai`.
 */
export function withShroud<P, R extends { text: string }>(
  generateText: (params: P) => Promise<R>,
  options?: RedactOptions,
): (params: P) => Promise<R> {
  return (params: P) => {
    const texts = collect(params);
    if (texts.length === 0) return generateText(params);
    const { redacted, mapping } = redactStrings(texts, options);
    const newParams = rebuild(params, redacted) as P;
    return generateText(newParams).then((result) => {
      if (typeof result?.text !== "string") return result;
      return { ...result, text: rehydrate(result.text, mapping) };
    });
  };
}
