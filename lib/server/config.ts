import type { ProviderId, PublicConfig } from "@/types/companion";
import { HttpError } from "./http";
export const VOICES = ["marin", "cedar", "coral", "alloy", "sage", "shimmer"];
const list = (value: string | undefined, fallback: string) =>
  (value || fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
export function publicConfig(
  env: Record<string, string | undefined> = process.env,
): PublicConfig {
  const providers: PublicConfig["providers"] = [
    { id: "demo", label: "Offline demo", configured: true, models: ["demo"] },
    {
      id: "openai",
      label: "OpenAI",
      configured: !!env.OPENAI_API_KEY,
      models: list(env.OPENAI_MODELS, env.OPENAI_CHAT_MODEL || "gpt-4.1-mini"),
    },
    {
      id: "openrouter",
      label: "OpenRouter",
      configured: !!env.OPENROUTER_API_KEY && !!env.OPENROUTER_MODEL,
      models: list(env.OPENROUTER_MODELS, env.OPENROUTER_MODEL || ""),
    },
    {
      id: "compatible",
      label: "Compatible API",
      configured: !!env.AI_BASE_URL && !!env.AI_MODEL,
      models: list(env.AI_MODELS, env.AI_MODEL || ""),
    },
  ];
  return {
    providers,
    defaultProvider:
      providers.find((p) => p.id === env.CHAT_PROVIDER && p.configured)?.id ||
      providers.find((p) => p.id !== "demo" && p.configured)?.id ||
      "demo",
    realtime: !!env.OPENAI_API_KEY,
    speech: !!env.OPENAI_API_KEY,
    voices: VOICES,
  };
}
export function providerConfig(id: ProviderId, model: string) {
  const option = publicConfig().providers.find((p) => p.id === id);
  if (!option?.configured)
    throw new HttpError(
      503,
      "This provider needs server configuration. See Settings → Connection.",
    );
  if (!option.models.includes(model))
    throw new HttpError(400, "Choose a model configured on your server.");
  if (id === "openai")
    return {
      base: "https://api.openai.com/v1",
      key: process.env.OPENAI_API_KEY,
    };
  if (id === "openrouter")
    return {
      base: "https://openrouter.ai/api/v1",
      key: process.env.OPENROUTER_API_KEY,
    };
  return {
    base: process.env.AI_BASE_URL?.replace(/\/$/, "") || "",
    key: process.env.AI_API_KEY,
  };
}
