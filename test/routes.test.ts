import test from "node:test";
import assert from "node:assert/strict";
import { POST as chat } from "../app/api/chat/route";
import { POST as realtime } from "../app/api/realtime/route";
import { POST as speech } from "../app/api/speech/route";
const payload = {
  provider: "demo",
  model: "demo",
  character: "mio",
  messages: [{ role: "user", content: "Hello" }],
  memories: [],
};
const request = (route: string, body: unknown) =>
  new Request(`http://localhost:3000/api/${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
async function withEnv<T>(
  values: Record<string, string | undefined>,
  run: () => Promise<T>,
) {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}
test("offline chat streams a labeled reply and final emotion", async () => {
  const response = await chat(request("chat", payload));
  assert.equal(response.status, 200);
  const events = (await response.text())
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l));
  assert.ok(
    events
      .filter((e) => e.type === "delta")
      .map((e) => e.text)
      .join("")
      .includes("scripted demo"),
  );
  assert.equal(events.at(-1).type, "done");
});
test("missing audio configuration produces actionable errors", async () =>
  withEnv({ OPENAI_API_KEY: undefined }, async () => {
    const voice = await realtime(
      request("realtime", {
        sdp: "v=0\r\ns=example",
        character: "mio",
        voice: "marin",
        messages: [],
        memories: [],
      }),
    );
    const tts = await speech(
      request("speech", { text: "Hello", voice: "marin" }),
    );
    assert.equal(voice.status, 503);
    assert.equal(tts.status, 503);
    assert.match((await voice.json()).error, /OPENAI_API_KEY/);
  }));
test("compatible adapter attaches a frame only to the last turn and keeps keys private", async () =>
  withEnv(
    {
      AI_BASE_URL: "https://example.invalid/v1",
      AI_MODEL: "test-model",
      AI_API_KEY: "private-test-key",
    },
    async () => {
      const original = globalThis.fetch;
      let body: Record<string, unknown> = {};
      globalThis.fetch = async (_input, init) => {
        body = JSON.parse(String(init?.body));
        return new Response(
          'data: {"choices":[{"delta":{"content":"I see a window."}}]}\n\ndata: [DONE]\n\n',
        );
      };
      try {
        const response = await chat(
          request("chat", {
            ...payload,
            provider: "compatible",
            model: "test-model",
            frame: "data:image/jpeg;base64,YWJj",
          }),
        );
        const output = await response.text();
        assert.equal(response.status, 200);
        assert.match(output, /I see a window/);
        assert.ok(!output.includes("private-test-key"));
        const messages = body.messages as { role: string; content: unknown }[];
        assert.equal(messages[0].role, "system");
        assert.ok(Array.isArray(messages.at(-1)?.content));
      } finally {
        globalThis.fetch = original;
      }
    },
  ));
test("provider failures are sanitized", async () =>
  withEnv({ OPENAI_API_KEY: "private-test-key" }, async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response("private-test-key", { status: 401 });
    try {
      const response = await chat(
        request("chat", {
          ...payload,
          provider: "openai",
          model: "gpt-4.1-mini",
        }),
      );
      const text = await response.text();
      assert.equal(response.status, 502);
      assert.ok(!text.includes("private-test-key"));
      assert.match(text, /API key/);
    } finally {
      globalThis.fetch = original;
    }
  }));
test("realtime exchanges SDP with a server key and includes the screen tool", async () =>
  withEnv({ OPENAI_API_KEY: "private-test-key" }, async () => {
    const original = globalThis.fetch;
    let session: Record<string, unknown> = {};
    globalThis.fetch = async (_input, init) => {
      session = JSON.parse(String((init?.body as FormData).get("session")));
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        "Bearer private-test-key",
      );
      return new Response("v=0\r\ns=answer");
    };
    try {
      const response = await realtime(
        request("realtime", {
          sdp: "v=0\r\ns=offer",
          character: "mio",
          voice: "marin",
          memories: [],
          messages: [],
        }),
      );
      assert.equal(response.status, 200);
      assert.equal(await response.text(), "v=0\r\ns=answer");
      assert.match(JSON.stringify(session.tools), /view_current_screen/);
    } finally {
      globalThis.fetch = original;
    }
  }));
