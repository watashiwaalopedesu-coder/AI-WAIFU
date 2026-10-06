"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCharacter } from "@/characters";
import { streamChat } from "@/lib/ai/client";
import { emotionProvider } from "@/lib/avatar/controller";
import { boundedContext } from "@/lib/memory/context";
import {
  loadConversation,
  loadSettings,
  localMemoryStore,
  persist,
  saveConversation,
} from "@/lib/memory/store";
import { asksAboutScreen, mediaError } from "@/lib/vision/capture";
import { OpenAIRealtime } from "@/lib/voice/realtime";
import { SpeechPlayer } from "@/lib/voice/speech";
import type {
  Activity,
  Emotion,
  Memory,
  Message,
  PublicConfig,
  Settings,
} from "@/types/companion";
import { useScreen } from "./use-screen";
function newMessage(
  role: Message["role"],
  content: string,
  source: Message["source"] = "text",
): Message {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    source,
    createdAt: new Date().toISOString(),
  };
}
function initialMessages(character: string) {
  const saved = loadConversation(character);
  return saved.length
    ? saved
    : [newMessage("assistant", getCharacter(character).greeting)];
}
export function useCompanion() {
  const [settings, setSettings] = useState(loadSettings),
    [messages, setMessages] = useState<Message[]>(() =>
      initialMessages(loadSettings().character),
    ),
    [memories, setMemories] = useState<Memory[]>(() => localMemoryStore.read()),
    [config, setConfig] = useState<PublicConfig | null>(null),
    [activity, setActivity] = useState<Activity>("idle"),
    [emotion, setEmotion] = useState<Emotion>("neutral"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [analyzing, setAnalyzing] = useState(false),
    [level, setLevel] = useState(0),
    [voiceActive, setVoiceActive] = useState(false),
    [muted, setMuted] = useState(false);
  const abort = useRef<AbortController | null>(null),
    voice = useRef<OpenAIRealtime | null>(null),
    speech = useRef<SpeechPlayer | null>(null),
    busyRef = useRef(false),
    speechGeneration = useRef(0),
    current = useRef({ settings, messages, memories });
  const report = useCallback((message: string) => setError(message), []);
  const screen = useScreen(report);
  const { sharing, frame: captureScreen } = screen;
  useEffect(() => {
    current.current = { settings, messages, memories };
  }, [settings, messages, memories]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/config", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((value: PublicConfig) => {
        setConfig(value);
        let saved = false;
        try {
          saved = !!localStorage.getItem("ai-waifu:v2:settings");
        } catch {}
        if (!saved)
          setSettings((s) => ({
            ...s,
            provider: value.defaultProvider,
            model:
              value.providers.find((p) => p.id === value.defaultProvider)
                ?.models[0] || "demo",
          }));
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          report("Could not read your server settings. Reload to reconnect.");
      });
    return () => controller.abort();
  }, [report]);
  // Report external browser-storage failures without silently losing the user's history.
  useEffect(() => {
    if (config && !persist("settings", settings)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Surface an external storage write failure.
      report(
        "Settings could not be saved. Changes last for this session only.",
      );
    }
  }, [settings, config, report]);
  useEffect(() => {
    if (!saveConversation(settings.character, messages)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Surface an external storage write failure.
      report(
        "Your conversation could not be saved. Browser storage may be full.",
      );
    }
  }, [messages, settings.character, report]);
  useEffect(() => {
    voice.current?.volume(settings.volume);
  }, [settings.volume]);
  useEffect(
    () => () => {
      abort.current?.abort();
      voice.current?.stop();
      speech.current?.stop();
    },
    [],
  );
  const stopSpeech = useCallback(() => {
    speechGeneration.current++;
    speech.current?.stop();
    speech.current = null;
    setLevel(0);
  }, []);
  const stopVoice = useCallback(() => {
    voice.current?.stop();
    voice.current = null;
    setVoiceActive(false);
    setMuted(false);
    setActivity("idle");
    setAnalyzing(false);
  }, []);
  const stop = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    busyRef.current = false;
    setBusy(false);
    setAnalyzing(false);
    stopSpeech();
    stopVoice();
  }, [stopSpeech, stopVoice]);
  const speak = useCallback(
    async (text: string) => {
      if (voice.current) return;
      stopSpeech();
      const token = speechGeneration.current,
        options = current.current.settings,
        player = new SpeechPlayer(options.tts);
      speech.current = player;
      setActivity("speaking");
      try {
        await player.speak(text, {
          voice: options.voice,
          volume: options.volume,
          onLevel: setLevel,
        });
      } catch (e) {
        if (
          token === speechGeneration.current &&
          !(e instanceof DOMException && e.name === "AbortError")
        )
          report(
            e instanceof Error ? e.message : "Speech could not be played.",
          );
      } finally {
        if (token === speechGeneration.current) {
          setActivity("idle");
          setLevel(0);
          speech.current = null;
        }
      }
    },
    [report, stopSpeech],
  );
  const send = useCallback(
    async (text: string, useScreen = false, automatic = false) => {
      text = text.trim();
      if (!text || text.length > 4000 || busyRef.current) return;
      const snapshot = current.current,
        options = snapshot.settings;
      if (automatic && voice.current) return;
      stopSpeech();
      setError("");
      busyRef.current = true;
      setBusy(true);
      const controller = new AbortController();
      abort.current = controller;
      let assistantId = "",
        complete = false;
      try {
        let frame: string | undefined;
        if (options.vision && sharing && (useScreen || asksAboutScreen(text))) {
          setAnalyzing(true);
          frame = await captureScreen();
        }
        if (controller.signal.aborted) return;
        if (useScreen && !frame)
          throw new Error("Share a screen and enable visual analysis first.");
        const user = {
          ...newMessage("user", text, automatic ? "screen" : "text"),
          screen: !!frame,
        };
        setMessages((m) => [...m, user].slice(-100));
        if (voice.current) {
          voice.current.sendText(text, frame);
          complete = true;
          return;
        }
        setActivity("thinking");
        const assistant = newMessage("assistant", "");
        assistantId = assistant.id;
        setMessages((m) => [...m, assistant].slice(-100));
        let full = "";
        await streamChat(
          {
            provider: options.provider,
            model: options.model,
            character: options.character,
            messages: boundedContext([
              ...snapshot.messages.filter((m) => !m.failed),
              user,
            ]).map(({ role, content }) => ({ role, content })),
            memories: options.memory
              ? snapshot.memories.map(({ text }) => ({ text }))
              : [],
            frame,
          },
          controller.signal,
          (event) => {
            if (controller.signal.aborted) return;
            if (event.type === "delta") {
              full += event.text;
              setMessages((m) =>
                m.map((item) =>
                  item.id === assistant.id ? { ...item, content: full } : item,
                ),
              );
            }
            if (event.type === "done") {
              setEmotion(event.emotion);
              complete = true;
            }
          },
        );
        setActivity("idle");
        if (options.speech && full) void speak(full);
      } catch (e) {
        if (!controller.signal.aborted) {
          report(
            e instanceof Error ? e.message : "Could not send your message.",
          );
          setActivity("error");
        }
      } finally {
        if (assistantId && !complete)
          setMessages((m) =>
            m
              .map((item) =>
                item.id === assistantId ? { ...item, failed: true } : item,
              )
              .filter((item) => item.content),
          );
        if (abort.current === controller) {
          abort.current = null;
          busyRef.current = false;
          setBusy(false);
          setAnalyzing(false);
        }
      }
    },
    [report, sharing, captureScreen, speak, stopSpeech],
  );
  useEffect(() => {
    if (
      !sharing ||
      !settings.vision ||
      !settings.autoAnalyze ||
      settings.provider === "demo" ||
      voiceActive
    )
      return;
    const timer = setInterval(() => {
      void send(
        "Briefly describe useful details on my current screen.",
        true,
        true,
      );
    }, settings.captureInterval * 1000);
    return () => clearInterval(timer);
  }, [
    sharing,
    settings.vision,
    settings.autoAnalyze,
    settings.captureInterval,
    settings.provider,
    voiceActive,
    send,
  ]);
  const startVoice = useCallback(async () => {
    if (voice.current || busyRef.current) return;
    if (!config?.realtime) {
      report(
        "To use realtime voice, set OPENAI_API_KEY in .env.local and restart. Text chat and browser speech can use other providers.",
      );
      return;
    }
    stopSpeech();
    setError("");
    setMuted(false);
    setVoiceActive(true);
    const session = new OpenAIRealtime({
      state: setActivity,
      level: setLevel,
      error: (message) => {
        report(message);
        setVoiceActive(false);
        voice.current = null;
        setAnalyzing(false);
      },
      transcript: (id, role, text, final) => {
        if (!text.trim()) return;
        setMessages((previous) => {
          const exists = previous.some((m) => m.id === id),
            entry = {
              id,
              role,
              content: text.slice(0, 6000),
              createdAt: new Date().toISOString(),
              source: "voice" as const,
            };
          return (
            exists
              ? previous.map((m) =>
                  m.id === id ? { ...m, content: entry.content } : m,
                )
              : [...previous, entry]
          ).slice(-100);
        });
        if (final && role === "assistant") {
          setEmotion(emotionProvider.infer(text));
          setAnalyzing(false);
        }
      },
      screen: async () => {
        if (!current.current.settings.vision)
          throw new Error("Visual analysis is disabled.");
        setAnalyzing(true);
        try {
          return await captureScreen();
        } catch (e) {
          setAnalyzing(false);
          throw e;
        }
      },
    });
    voice.current = session;
    try {
      const s = current.current;
      await session.start(s.settings, s.memories, s.messages);
    } catch (e) {
      if (voice.current === session) {
        session.stop();
        voice.current = null;
        setVoiceActive(false);
        setActivity("error");
        report(mediaError(e, "microphone"));
      }
    }
  }, [config, report, captureScreen, stopSpeech]);
  const changeSettings = useCallback(
    (patch: Partial<Settings>) => {
      if (
        patch.character &&
        patch.character !== current.current.settings.character
      ) {
        stop();
        setMessages(initialMessages(patch.character));
        setEmotion("neutral");
      }
      if (
        voice.current &&
        (patch.voice !== undefined ||
          patch.microphone !== undefined ||
          patch.memory !== undefined)
      )
        stopVoice();
      setSettings((s) => ({ ...s, ...patch }));
    },
    [stop, stopVoice],
  );
  const saveMemories = useCallback(
    (next: Memory[]) => {
      stopVoice();
      setMemories(next);
      try {
        localMemoryStore.save(next);
      } catch {
        report(
          "Memories could not be saved. Your browser storage may be full.",
        );
      }
    },
    [report, stopVoice],
  );
  const clearConversation = useCallback(() => {
    stop();
    setMessages([
      newMessage(
        "assistant",
        getCharacter(current.current.settings.character).greeting,
      ),
    ]);
    setError("");
    setEmotion("neutral");
  }, [stop]);
  const toggleMute = useCallback(() => {
    setMuted((value) => {
      voice.current?.mute(!value);
      return !value;
    });
  }, []);
  return {
    settings,
    changeSettings,
    messages,
    memories,
    saveMemories,
    config,
    character: getCharacter(settings.character),
    activity,
    emotion,
    error,
    dismissError: () => setError(""),
    busy,
    analyzing,
    level,
    voiceActive,
    muted,
    screen,
    send,
    speak,
    stop,
    stopVoice,
    startVoice,
    toggleMute,
    clearConversation,
  };
}
