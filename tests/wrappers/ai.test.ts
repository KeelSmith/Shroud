import { describe, it, expect } from "vitest";
import { withShroud } from "../../src/wrappers/ai.js";

describe("withShroud", () => {
  it("redacts a string prompt and rehydrates result.text", async () => {
    let seen: any;
    const gen = withShroud((params: any) => {
      seen = params;
      return Promise.resolve({ text: `draft: ${params.prompt}`, finishReason: "stop" });
    });
    const res = await gen({ model: "m", prompt: "reply to jane@acme.com" });
    expect(seen.prompt).toBe("reply to [SHROUD_EMAIL_1]");
    expect(res.text).toBe("draft: reply to jane@acme.com");
  });

  it("redacts system + messages (incl. array text parts) under one shared mapping", async () => {
    let seen: any;
    const gen = withShroud((params: any) => {
      seen = params;
      return Promise.resolve({ text: "ok" });
    });
    await gen({
      model: "m",
      system: "user a@b.com",
      messages: [
        { role: "user", content: "ping a@b.com" },
        {
          role: "user",
          content: [
            { type: "text", text: "card 4111111111111111" },
            { type: "image", image: "x" },
          ],
        },
      ],
    });
    expect(seen.system).toBe("user [SHROUD_EMAIL_1]");
    expect(seen.messages[0].content).toBe("ping [SHROUD_EMAIL_1]");
    expect(seen.messages[1].content[0]).toEqual({ type: "text", text: "card [SHROUD_CARD_1]" });
    expect(seen.messages[1].content[1]).toEqual({ type: "image", image: "x" });
  });

  it("redacts a prompt given as a messages array", async () => {
    let seen: any;
    const gen = withShroud((params: any) => {
      seen = params;
      return Promise.resolve({ text: "ok" });
    });
    await gen({ model: "m", prompt: [{ role: "user", content: "to a@b.com" }] });
    expect(seen.prompt[0].content).toBe("to [SHROUD_EMAIL_1]");
  });

  it("returns the result unchanged when it has no text field", async () => {
    const fake = (() => Promise.resolve({ finishReason: "stop" })) as unknown as (
      p: unknown,
    ) => Promise<{ text: string }>;
    const gen = withShroud(fake);
    const res = await gen({ model: "m", prompt: "hi jane@acme.com" });
    expect((res as { finishReason?: string }).finishReason).toBe("stop");
  });

  it("passes through when nothing is detected", async () => {
    let seen: any;
    const gen = withShroud((params: any) => {
      seen = params;
      return Promise.resolve({ text: "fine" });
    });
    const res = await gen({ model: "m", prompt: "hello world" });
    expect(seen.prompt).toBe("hello world");
    expect(res.text).toBe("fine");
  });
});
