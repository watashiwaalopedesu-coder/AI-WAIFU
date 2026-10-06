import type { Memory, Message, ProviderId } from "@/types/companion";
export type ChatInput = {
  messages: Pick<Message, "role" | "content">[];
  character: string;
  memories: Pick<Memory, "text">[];
  provider: ProviderId;
  model: string;
  frame?: string;
};
export interface TextProvider {
  stream(input: ChatInput, signal: AbortSignal): AsyncIterable<string>;
}
export interface VisionProvider extends TextProvider {
  supportsImages: boolean;
}
export interface SpeechToTextProvider {
  transcribe(audio: Blob, signal?: AbortSignal): Promise<string>;
}
export interface TextToSpeechProvider {
  speak(
    text: string,
    options: {
      voice: string;
      volume: number;
      onLevel: (level: number) => void;
    },
  ): Promise<void>;
  stop(): void;
}
