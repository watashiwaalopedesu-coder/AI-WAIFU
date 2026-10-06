import { getProvider } from "@/lib/ai/providers";
import { emotionProvider } from "@/lib/avatar/controller";
import { chatSchema } from "@/lib/server/schema";
import { readJson, errorResponse, HttpError } from "@/lib/server/http";
import type { StreamEvent } from "@/types/companion";
export const runtime = "nodejs";
export const maxDuration = 65;
export async function POST(request: Request) {
  try {
    const input = await readJson(request, chatSchema),
      upstream = new AbortController();
    const iterator = getProvider(input.provider)
      .stream(input, AbortSignal.any([request.signal, upstream.signal]))
      [Symbol.asyncIterator]();
    let pending = await iterator.next(),
      combined = "",
      finished = false;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async pull(controller) {
        const send = (e: StreamEvent) =>
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        try {
          if (!pending.done && combined.length < 6000) {
            const text = pending.value.slice(0, 6000 - combined.length);
            combined += text;
            send({ type: "delta", text });
            pending = await iterator.next();
          } else {
            if (!combined)
              throw new HttpError(502, "The provider returned an empty reply.");
            send({ type: "done", emotion: emotionProvider.infer(combined) });
            finished = true;
            controller.close();
            await iterator.return?.();
          }
        } catch (e) {
          if (!finished) {
            send({
              type: "error",
              error:
                e instanceof HttpError
                  ? e.message
                  : "The connection was interrupted. Please try again.",
            });
            finished = true;
            controller.close();
            await iterator.return?.();
          }
        }
      },
      async cancel() {
        finished = true;
        upstream.abort();
        await iterator.return?.();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
