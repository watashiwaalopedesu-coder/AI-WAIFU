import { z } from "zod";
export const settingsSchema = z.object({
  provider: z
    .enum(["demo", "openai", "openrouter", "compatible"])
    .catch("demo"),
  model: z.string().max(120).catch("demo"),
  character: z.enum(["mio", "rin"]).catch("mio"),
  voice: z.string().max(50).catch("marin"),
  volume: z.number().min(0).max(1).catch(0.8),
  speech: z.boolean().catch(false),
  tts: z.enum(["browser", "openai"]).catch("browser"),
  microphone: z.string().max(200).catch("default"),
  vision: z.boolean().catch(true),
  autoAnalyze: z.boolean().catch(false),
  captureInterval: z.number().min(15).max(120).catch(30),
  memory: z.boolean().catch(true),
  avatar: z.enum(["sprite", "portrait"]).catch("sprite"),
  expressionIntensity: z.number().min(0).max(1).catch(0.7),
  lipSync: z.boolean().catch(true),
  animation: z.boolean().catch(true),
});
export const DEFAULT_SETTINGS = settingsSchema.parse({});
