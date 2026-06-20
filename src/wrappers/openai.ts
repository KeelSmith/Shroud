/* OpenAI adapter. Wraps the untyped client surface — see ADR-0004; unsafe-* lint scoped-off. */
import type { RedactOptions } from "../types.js";
import { redactStrings, rehydrate } from "./internal.js";
import { interceptMethod } from "./proxy.js";

function isTextPart(part: any): boolean {
  return typeof part === "object" && part !== null && part.type === "text" && typeof part.text === "string";
}

function collect(messages: any[]): string[] {
  const out: string[] = [];
  for (const msg of messages) {
    const content = msg?.content;
    if (typeof content === "string") out.push(content);
    else if (Array.isArray(content)) for (const part of content) if (isTextPart(part)) out.push(part.text);
  }
  return out;
}

function rebuild(messages: any[], redacted: string[]): any[] {
  let i = 0;
  const next = (): string => redacted[i++] as string; // aligned 1:1 with collect()
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

function rehydrateResponse(res: any, mapping: Record<string, string>): any {
  if (!res || !Array.isArray(res.choices)) return res;
  return {
    ...res,
    choices: res.choices.map((choice: any) => {
      const content = choice?.message?.content;
      if (typeof content !== "string") return choice;
      return { ...choice, message: { ...choice.message, content: rehydrate(content, mapping) } };
    }),
  };
}

/**
 * Wrap an OpenAI client so `chat.completions.create` redacts message text on the way out and
 * rehydrates `choices[].message.content` on the way back. All other client behavior is
 * forwarded untouched. The SDK is an optional peer — this never imports `openai`.
 */
export function wrapOpenAI<T extends object>(client: T, options?: RedactOptions): T {
  return interceptMethod(client, ["chat", "completions", "create"], (create) => {
    return (params: any, ...rest: any[]) => {
      const messages: any[] = Array.isArray(params?.messages) ? params.messages : [];
      const texts = collect(messages);
      if (texts.length === 0) return create(params, ...rest);
      const { redacted, mapping } = redactStrings(texts, options);
      const newParams = { ...params, messages: rebuild(messages, redacted) };
      return Promise.resolve(create(newParams, ...rest)).then((res) => rehydrateResponse(res, mapping));
    };
  });
}
