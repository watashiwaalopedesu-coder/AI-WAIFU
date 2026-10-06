import type { ChatInput } from "./contracts";
import type { StreamEvent } from "@/types/companion";
export async function streamChat(
  input: ChatInput,
  signal: AbortSignal,
  onEvent: (event: StreamEvent) => void,
) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok)
    throw new Error(
      (await response.json()).error || "Could not send your message.",
    );
  if (!response.body) throw new Error("No reply was received.");
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = "",
    complete = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const event: StreamEvent = JSON.parse(line);
        if (event.type === "error") throw new Error(event.error);
        if (event.type === "done") complete = true;
        onEvent(event);
      }
      if (done) break;
    }
    if (!complete)
      throw new Error("The reply was interrupted. Please try again.");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
