import { z } from "zod";
const message = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});
const memories = z
  .array(z.object({ text: z.string().trim().min(1).max(280) }))
  .max(12)
  .default([]);
export const chatSchema = z
  .object({
    provider: z.enum(["demo", "openai", "openrouter", "compatible"]),
    model: z.string().min(1).max(120),
    character: z.enum(["mio", "rin"]),
    messages: z.array(message).min(1).max(24),
    memories,
    frame: z
      .string()
      .max(700000)
      .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/)
      .optional(),
  })
  .refine((data) => data.messages.at(-1)?.role === "user");
export const realtimeSchema = z.object({
  sdp: z.string().min(10).max(100000),
  character: z.enum(["mio", "rin"]),
  voice: z.string().max(50),
  memories,
  messages: z.array(message).max(24).default([]),
});
export const speechSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  voice: z.string().max(50),
});
