import { describe, it, expect } from "vitest";
import { wrapAnthropic } from "../../src/wrappers/anthropic.js";

function fakeAnthropic(captured: { params?: any }) {
  return {
    messages: {
      create(params: any) {
        captured.params = params;
        const userText = params.messages
          .map((m: any) => (typeof m.content === "string" ? m.content : ""))
          .join(" | ");
        return Promise.resolve({
          id: "msg_1",
          role: "assistant",
          content: [{ type: "text", text: `ack ${userText}` }],
        });
      },
    },
  };
}

describe("wrapAnthropic", () => {
  it("redacts system + messages and rehydrates response text blocks", async () => {
    const captured: { params: any } = { params: null };
    const client = wrapAnthropic(fakeAnthropic(captured));
    const res = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 64,
      system: "the user is a@b.com",
      messages: [{ role: "user", content: "call 415-555-0132" }],
    });
    expect(captured.params.system).toBe("the user is [SHROUD_EMAIL_1]");
    expect(captured.params.messages[0].content).toBe("call [SHROUD_PHONE_1]");
    expect(res.content[0]!.text).toBe("ack call 415-555-0132");
  });

  it("rehydrates a response that echoes a redacted value", async () => {
    const client = wrapAnthropic({
      messages: {
        create(params: any) {
          void params;
          return Promise.resolve({ content: [{ type: "text", text: "mailed [SHROUD_EMAIL_1]" }] });
        },
      },
    });
    const res = await client.messages.create({
      model: "m",
      max_tokens: 10,
      messages: [{ role: "user", content: "write to jane@acme.com" }],
    });
    expect(res.content[0]!.text).toBe("mailed jane@acme.com");
  });

  it("redacts text blocks in array content and rehydrates response blocks", async () => {
    const captured: { params: any } = { params: null };
    const client = wrapAnthropic({
      messages: {
        create(params: any) {
          captured.params = params;
          return Promise.resolve({
            content: [
              { type: "text", text: "saw [SHROUD_CARD_1]" },
              { type: "tool_use", id: "t1" },
            ],
          });
        },
      },
    });
    const res = await client.messages.create({
      model: "m",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "pay 4111111111111111" },
            { type: "image", source: { kind: "x" } },
          ],
        },
      ],
    });
    expect(captured.params.messages[0].content[0]).toEqual({ type: "text", text: "pay [SHROUD_CARD_1]" });
    expect(captured.params.messages[0].content[1]).toEqual({ type: "image", source: { kind: "x" } });
    expect(res.content[0]!.text).toBe("saw 4111111111111111");
    expect(res.content[1]).toEqual({ type: "tool_use", id: "t1" });
  });

  it("passes through when there is nothing to redact", async () => {
    const captured: { params: any } = { params: null };
    const client = wrapAnthropic(fakeAnthropic(captured));
    await client.messages.create({
      model: "m",
      max_tokens: 10,
      messages: [{ role: "user", content: "hello" }],
    });
    expect(captured.params.messages[0].content).toBe("hello");
  });
});
