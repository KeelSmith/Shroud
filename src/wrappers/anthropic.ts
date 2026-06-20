/* Anthropic adapter. Wraps the untyped client surface — see ADR-0004; unsafe-* lint scoped-off. */
import type { RedactOptions } from "../types.js";
import { redactStrings, rehydrate } from "./internal.js";
import { interceptMethod } from "./proxy.js";

function isTextBlock(block: any): boolean {
  return typeof block === "object" && block !== null && block.type === "text" && typeof block.text === "string";
}

/** Collect text from `system` (string) + each message's content (string or text blocks). */
function collect(params: any): string[] {
  const out: string[] = [];
  if (typeof params?.system === "string") out.push(params.system);
  const messages: any[] = Array.isArray(params?.messages) ? params.messages : [];
  for (const msg of messages) {
    const content = msg?.content;
    if (typeof content === "string") out.push(content);
    else if (Array.isArray(content)) for (const block of content) if (isTextBlock(block)) out.push(block.text);
  }
  return out;
}

function rebuild(params: any, redacted: string[]): any {
  let i = 0;
  const next = (): string => redacted[i++] as string; // aligned 1:1 with collect()
  const out: any = { ...params };
  if (typeof params?.system === "string") out.system = next();
  const messages: any[] = Array.isArray(params?.messages) ? params.messages : [];
  out.messages = messages.map((msg) => {
    const content = msg?.content;
    if (typeof content === "string") return { ...msg, content: next() };
    if (Array.isArray(content)) {
      return {
        ...msg,
        content: content.map((block) => (isTextBlock(block) ? { ...block, text: next() } : block)),
      };
    }
    return msg;
  });
  return out;
}

function rehydrateResponse(res: any, mapping: Record<string, string>): any {
  if (!res || !Array.isArray(res.content)) return res;
  return {
    ...res,
    content: res.content.map((block: any) =>
      isTextBlock(block) ? { ...block, text: rehydrate(block.text, mapping) } : block,
    ),
  };
}

/**
 * Wrap an Anthropic client so `messages.create` redacts `system` + message text on the way
 * out and rehydrates the response's text blocks on the way back. All other behavior is
 * forwarded untouched. The SDK is an optional peer — this never imports `@anthropic-ai/sdk`.
 */
export function wrapAnthropic<T extends object>(client: T, options?: RedactOptions): T {
  return interceptMethod(client, ["messages", "create"], (create) => {
    return (params: any, ...rest: any[]) => {
      const texts = collect(params);
      if (texts.length === 0) return create(params, ...rest);
      const { redacted, mapping } = redactStrings(texts, options);
      const newParams = rebuild(params, redacted);
      return Promise.resolve(create(newParams, ...rest)).then((res) => rehydrateResponse(res, mapping));
    };
  });
}
