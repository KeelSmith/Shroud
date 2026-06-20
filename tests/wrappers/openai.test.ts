import { describe, it, expect } from "vitest";
import { wrapOpenAI } from "../../src/wrappers/openai.js";

function fakeOpenAI(captured: { params?: any }) {
  return {
    apiKey: "test-key",
    chat: {
      completions: {
        create(params: any) {
          captured.params = params;
          const echo = params.messages
            .map((m: any) => (typeof m.content === "string" ? m.content : ""))
            .join(" | ");
          return Promise.resolve({
            id: "cmpl_1",
            choices: [{ index: 0, message: { role: "assistant", content: `reply: ${echo}` } }],
          });
        },
      },
    },
    other() {
      return "passthrough";
    },
  };
}

describe("wrapOpenAI", () => {
  it("redacts request messages and rehydrates the reply", async () => {
    const captured: { params: any } = { params: null };
    const client = wrapOpenAI(fakeOpenAI(captured));
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "email jane@acme.com please" }],
    });
    expect(captured.params.messages[0].content).toBe("email [SHROUD_EMAIL_1] please");
    expect(res.choices[0]!.message.content).toBe("reply: email jane@acme.com please");
  });

  it("shares one mapping so a value repeated across messages dedupes", async () => {
    const captured: { params: any } = { params: null };
    const client = wrapOpenAI(fakeOpenAI(captured));
    await client.chat.completions.create({
      model: "m",
      messages: [
        { role: "system", content: "contact a@b.com" },
        { role: "user", content: "again a@b.com" },
      ],
    });
    expect(captured.params.messages.map((m: any) => m.content)).toEqual([
      "contact [SHROUD_EMAIL_1]",
      "again [SHROUD_EMAIL_1]",
    ]);
  });

  it("redacts text parts inside array content and leaves non-text parts", async () => {
    const captured: { params: any } = { params: null };
    const client = wrapOpenAI(fakeOpenAI(captured));
    await client.chat.completions.create({
      model: "m",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "ping 415-555-0132" },
            { type: "image_url", image_url: { url: "https://x/y.png" } },
          ],
        },
      ],
    });
    const parts = captured.params.messages[0].content;
    expect(parts[0]).toEqual({ type: "text", text: "ping [SHROUD_PHONE_1]" });
    expect(parts[1]).toEqual({ type: "image_url", image_url: { url: "https://x/y.png" } });
  });

  it("leaves messages with non-text content untouched", async () => {
    const captured: { params: any } = { params: null };
    const client = wrapOpenAI(fakeOpenAI(captured));
    await client.chat.completions.create({
      model: "m",
      messages: [
        { role: "assistant", content: null },
        { role: "user", content: "email a@b.com" },
      ],
    });
    expect(captured.params.messages[0].content).toBe(null);
    expect(captured.params.messages[1].content).toBe("email [SHROUD_EMAIL_1]");
  });

  it("forwards other client properties and methods untouched", () => {
    const client = wrapOpenAI(fakeOpenAI({}));
    expect((client as any).other()).toBe("passthrough");
    expect((client as any).apiKey).toBe("test-key");
  });

  it("passes through when there is nothing to redact", async () => {
    const captured: { params: any } = { params: null };
    const client = wrapOpenAI(fakeOpenAI(captured));
    const res = await client.chat.completions.create({
      model: "m",
      messages: [{ role: "user", content: "hello there" }],
    });
    expect(captured.params.messages[0].content).toBe("hello there");
    expect(res.choices[0]!.message.content).toBe("reply: hello there");
  });
});
