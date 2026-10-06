import { z } from "zod";
import { settingsSchema } from "@/lib/settings";
import type { Memory, Message, Settings } from "@/types/companion";
export interface MemoryStore {
  read(): Memory[];
  save(memories: Memory[]): void;
  clear(): void;
}
const prefix = "ai-waifu:v2:";
const message = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().max(6000),
  createdAt: z.string(),
  screen: z.boolean().optional(),
  source: z.enum(["text", "voice", "screen"]).optional(),
  failed: z.boolean().optional(),
});
const memory = z
  .array(
    z.object({
      id: z.string(),
      text: z.string().max(280),
      createdAt: z.string(),
    }),
  )
  .max(12);
export function readSaved<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  try {
    const raw = localStorage.getItem(prefix + key);
    return !raw || raw.length > 750000
      ? fallback
      : schema.parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}
export function persist(key: string, data: unknown) {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export const localMemoryStore: MemoryStore = {
  read: () => readSaved("memories", memory, []),
  save: (memories) => {
    if (!persist("memories", memories.slice(0, 12)))
      throw new Error("Browser storage is unavailable.");
  },
  clear: () => localStorage.removeItem(prefix + "memories"),
};
export const loadSettings = (): Settings =>
  readSaved("settings", settingsSchema, settingsSchema.parse({}));
export const loadConversation = (character: string): Message[] =>
  readSaved("chat:" + character, z.array(message).max(100), []);
export const saveConversation = (character: string, messages: Message[]) =>
  persist("chat:" + character, messages.filter((m) => m.content).slice(-100));
