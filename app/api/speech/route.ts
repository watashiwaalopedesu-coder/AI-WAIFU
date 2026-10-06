import { VOICES } from "@/lib/server/config";
import {
  readJson,
  errorResponse,
  HttpError,
  requireOk,
} from "@/lib/server/http";
import { speechSchema } from "@/lib/server/schema";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const input = await readJson(request, speechSchema, 25000);
    if (!process.env.OPENAI_API_KEY)
      throw new HttpError(
        503,
        "OpenAI speech needs OPENAI_API_KEY. You can choose Browser voice in Settings.",
      );
    if (!VOICES.includes(input.voice))
      throw new HttpError(400, "Choose a supported voice.");
    const response = await requireOk(
      await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
          voice: input.voice,
          input: input.text,
          response_format: "mp3",
        }),
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(30000)]),
        redirect: "error",
      }),
    );
    return new Response(response.body, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
