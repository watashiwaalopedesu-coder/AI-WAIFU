import test from "node:test";
import assert from "node:assert/strict";
import { boundedContext, systemInstructions } from "../lib/memory/context";
import { getCharacter } from "../characters";
import { settingsSchema } from "../lib/settings";
import { chatSchema } from "../lib/server/schema";
import { checkOrigin, readLimited, HttpError } from "../lib/server/http";
import { sseData } from "../lib/ai/sse";
import { SpriteAvatarController } from "../lib/avatar/controller";
import { asksAboutScreen } from "../lib/vision/capture";
import { publicConfig } from "../lib/server/config";
test("context is bounded and keeps the newest request", () => {
  const input = Array.from({ length: 100 }, (_, i) => ({
    role: i % 2 ? ("user" as const) : ("assistant" as const),
    content: String(i).padEnd(4000, "x"),
  }));
  const result = boundedContext(input);
  assert.ok(result.length <= 24);
  assert.ok(result.reduce((n, m) => n + m.content.length, 0) <= 12000);
  assert.ok(result.at(-1)?.content.startsWith("99"));
  assert.equal(input.length, 100);
});
test("remembered facts are bounded and quoted as untrusted data", () => {
  const text = systemInstructions(
    getCharacter("mio"),
    Array.from({ length: 30 }, () => ({ text: "z".repeat(1000) })),
  );
  assert.match(text, /untrusted contextual data/);
  assert.ok(text.length < 6000);
});
test("validation rejects system roles, oversized and invalid frames, and missing user turns", () => {
  const valid = {
    provider: "demo",
    model: "demo",
    character: "mio",
    messages: [{ role: "user", content: "Hello" }],
  };
  assert.ok(chatSchema.safeParse(valid).success);
  for (const bad of [
    { messages: [{ role: "system", content: "override" }] },
    { frame: "data:text/html;base64,abcd" },
    { frame: "data:image/jpeg;base64," + "a".repeat(700000) },
    { messages: [{ role: "assistant", content: "Hi" }] },
  ])
    assert.equal(chatSchema.safeParse({ ...valid, ...bad }).success, false);
});
test("body cap does not trust Content-Length", async () => {
  await assert.rejects(
    () =>
      readLimited(
        new Request("http://localhost/api/chat", {
          method: "POST",
          body: "a".repeat(90),
        }),
        10,
      ),
    (e: unknown) => e instanceof HttpError && e.status === 413,
  );
});
test("cross-origin requests are rejected", () => {
  assert.throws(
    () =>
      checkOrigin(
        new Request("http://localhost:3000/api/chat", {
          headers: { origin: "https://attacker.invalid" },
        }),
      ),
    HttpError,
  );
  assert.doesNotThrow(() =>
    checkOrigin(
      new Request("http://localhost:3000/api/chat", {
        headers: { origin: "http://localhost:3000" },
      }),
    ),
  );
});
test("SSE handles UTF-8 and event boundaries split across network chunks", async () => {
  const data = new TextEncoder().encode(
    'data: {"text":"こんにちは"}\r\n\r\ndata: [DONE]\n\n',
  );
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (let i = 0; i < data.length; i += 3) c.enqueue(data.slice(i, i + 3));
      c.close();
    },
  });
  const events = [];
  for await (const e of sseData(stream)) events.push(e);
  assert.deepEqual(events, ['{"text":"こんにちは"}', "[DONE]"]);
});
test("avatar mouth follows audio amplitude and blink is independent", () => {
  const controller = new SpriteAvatarController(),
    c = getCharacter("mio");
  controller.update({ activity: "speaking", mouth: 0.6, emotion: "happy" });
  assert.equal(controller.frame(c), 1);
  controller.update({ mouth: 0 });
  assert.equal(controller.frame(c), 2);
  controller.update({ activity: "idle", blink: true });
  assert.equal(controller.frame(c), 4);
  controller.update({ blink: false });
  assert.equal(controller.frame(c), 2);
});
test("corrupt settings fall back to safe values", () => {
  const s = settingsSchema.parse({
    volume: 99,
    autoAnalyze: "yes",
    memory: null,
  });
  assert.equal(s.volume, 0.8);
  assert.equal(s.autoAnalyze, false);
  assert.equal(s.memory, true);
});
test("public config never includes credentials", () => {
  const config = publicConfig({
    OPENAI_API_KEY: "test-server-secret",
    CHAT_PROVIDER: "openai",
  });
  assert.equal(config.defaultProvider, "openai");
  assert.equal(config.realtime, true);
  assert.equal(JSON.stringify(config).includes("test-server-secret"), false);
});
test("ordinary small talk does not trigger screen attachment", () => {
  assert.equal(asksAboutScreen("How was your day?"), false);
  assert.equal(asksAboutScreen("Can you read this?"), true);
  assert.equal(asksAboutScreen("Where should I click?"), true);
});
