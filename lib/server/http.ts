import { z } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin"),
    host = request.headers.get("host") ?? new URL(request.url).host;
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new HttpError(403, "Cross-site requests are not allowed.");
  if (origin && new URL(origin).host !== host)
    throw new HttpError(403, "Open this app directly to continue.");
}
export async function readLimited(request: Request, max: number) {
  if (Number(request.headers.get("content-length")) > max)
    throw new HttpError(413, "That request is too large.");
  if (!request.body) return "";
  const reader = request.body.getReader(),
    decoder = new TextDecoder();
  let text = "",
    bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > max) {
        await reader.cancel();
        throw new HttpError(413, "That request is too large.");
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}
export async function readJson<T>(
  request: Request,
  schema: z.ZodType<T>,
  max = 900000,
) {
  checkOrigin(request);
  try {
    return schema.parse(JSON.parse(await readLimited(request, max)));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "Check the message and settings, then try again.");
  }
}
export function errorResponse(e: unknown) {
  return Response.json(
    {
      error:
        e instanceof HttpError
          ? e.message
          : "The service could not complete this request. Please try again.",
    },
    {
      status: e instanceof HttpError ? e.status : 500,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
export async function requireOk(response: Response) {
  if (!response.ok) {
    await response.body?.cancel();
    throw new HttpError(
      response.status === 429 ? 429 : 502,
      response.status === 429
        ? "The AI provider is at its usage limit. Check billing or try again shortly."
        : "The AI provider could not respond. Check the server API key, model, and account access.",
    );
  }
  return response;
}
