export type Emotion =
  | "neutral"
  | "happy"
  | "shy"
  | "nervous"
  | "surprised"
  | "serious"
  | "sad";
export type Activity =
  | "idle"
  | "connecting"
  | "listening"
  | "user-speaking"
  | "thinking"
  | "speaking"
  | "error";
export type ProviderId = "demo" | "openai" | "openrouter" | "compatible";
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  screen?: boolean;
  source?: "text" | "voice" | "screen";
  failed?: boolean;
};
export type Memory = { id: string; text: string; createdAt: string };
export type AvatarAtlas = {
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  frames: { name: string; x: number; y: number }[];
};
export type Character = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  personality: string;
  systemPrompt: string;
  greeting: string;
  exampleDialogue: { user: string; assistant: string }[];
  avatar: { base: string; sheet?: string; atlas?: AvatarAtlas };
  voice: string;
  speakingStyle: string;
  expressionMap: Record<Emotion, number>;
  emotionProfile: { default: Emotion; intensity: number };
  idle: { intervalMs: number; blinkMs: number };
  lipSync: { threshold: number; smoothing: number };
};
export type Settings = {
  provider: ProviderId;
  model: string;
  character: string;
  voice: string;
  volume: number;
  speech: boolean;
  tts: "browser" | "openai";
  microphone: string;
  vision: boolean;
  autoAnalyze: boolean;
  captureInterval: number;
  memory: boolean;
  avatar: "sprite" | "portrait";
  expressionIntensity: number;
  lipSync: boolean;
  animation: boolean;
};
export type ProviderOption = {
  id: ProviderId;
  label: string;
  configured: boolean;
  models: string[];
};
export type PublicConfig = {
  providers: ProviderOption[];
  defaultProvider: ProviderId;
  realtime: boolean;
  speech: boolean;
  voices: string[];
};
export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; emotion: Emotion }
  | { type: "error"; error: string };
