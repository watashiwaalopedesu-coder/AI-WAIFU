import type { TextToSpeechProvider } from "@/lib/ai/contracts";
import { analyseAudio } from "./level";
export class SpeechPlayer implements TextToSpeechProvider {
  private cancel: (() => void) | null = null;
  private abort: AbortController | null = null;
  constructor(private mode: "browser" | "openai") {}
  stop() {
    this.abort?.abort();
    this.abort = null;
    this.cancel?.();
    this.cancel = null;
  }
  async speak(
    text: string,
    options: {
      voice: string;
      volume: number;
      onLevel: (level: number) => void;
    },
  ) {
    this.stop();
    if (this.mode === "browser") {
      if (!("speechSynthesis" in window))
        throw new Error(
          "Your browser does not support spoken replies. Choose OpenAI speech in Settings.",
        );
      return new Promise<void>((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = options.volume;
        utterance.rate = 0.98;
        let timer: ReturnType<typeof setInterval> | undefined,
          ended = false;
        const finish = (error?: Error) => {
          if (ended) return;
          ended = true;
          clearInterval(timer);
          options.onLevel(0);
          this.cancel = null;
          if (error) reject(error);
          else resolve();
        };
        this.cancel = () => {
          window.speechSynthesis.cancel();
          finish();
        };
        utterance.onstart = () => {
          timer = setInterval(
            () =>
              options.onLevel(
                0.15 + Math.abs(Math.sin(Date.now() / 110)) * 0.6,
              ),
            85,
          );
        };
        utterance.onend = () => finish();
        utterance.onerror = (e) =>
          finish(
            ["canceled", "interrupted"].includes(e.error)
              ? undefined
              : new Error(
                  "Browser speech could not play. Check system voices or choose OpenAI speech.",
                ),
          );
        window.speechSynthesis.speak(utterance);
      });
    }
    const abort = new AbortController();
    this.abort = abort;
    const context = new AudioContext();
    let url = "",
      cleanup: (() => void) | undefined;
    try {
      await context.resume();
      if (abort.signal.aborted) return;
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.slice(0, 4000),
          voice: options.voice,
        }),
        signal: abort.signal,
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).error || "Speech could not be generated.",
        );
      const blob = await response.blob();
      if (abort.signal.aborted) return;
      url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = options.volume;
      const source = context.createMediaElementSource(audio);
      source.connect(context.destination);
      cleanup = analyseAudio(context, source, options.onLevel);
      await new Promise<void>((resolve, reject) => {
        const finish = () => {
          audio.pause();
          audio.removeAttribute("src");
          resolve();
        };
        this.cancel = finish;
        audio.onended = finish;
        audio.onerror = () => {
          audio.pause();
          reject(new Error("The voice could not be played."));
        };
        audio
          .play()
          .catch(() =>
            reject(
              new Error(
                "Audio was blocked. Click the message’s play button to try again.",
              ),
            ),
          );
      });
    } finally {
      cleanup?.();
      if (url) URL.revokeObjectURL(url);
      await context.close();
      this.cancel = null;
    }
  }
}
