"use client";
import { useEffect, useRef, useState } from "react";
import {
  BookHeart,
  Check,
  Cpu,
  Eye,
  Mic,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { characters } from "@/characters";
import type { Memory, PublicConfig, Settings } from "@/types/companion";
export type SettingsTab =
  | "connection"
  | "voice"
  | "vision"
  | "avatar"
  | "memory";
const tabs = [
  { id: "connection", label: "Connection", icon: Cpu },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "vision", label: "Screen", icon: Eye },
  { id: "avatar", label: "Character", icon: UserRound },
  { id: "memory", label: "Memory", icon: BookHeart },
] as const;
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
export function SettingsPanel({
  open,
  tab,
  onTab,
  onClose,
  settings,
  onChange,
  config,
  memories,
  onMemories,
  onClear,
}: {
  open: boolean;
  tab: SettingsTab;
  onTab: (tab: SettingsTab) => void;
  onClose: () => void;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  config: PublicConfig | null;
  memories: Memory[];
  onMemories: (memories: Memory[]) => void;
  onClear: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [fact, setFact] = useState(""),
    [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [deviceError, setDeviceError] = useState("");
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current?.close();
  }, [open]);
  const provider = config?.providers.find((p) => p.id === settings.provider);
  async function refreshDevices() {
    try {
      if (!navigator.mediaDevices?.enumerateDevices)
        throw new Error("Microphone selection is unavailable.");
      setDevices(
        (await navigator.mediaDevices.enumerateDevices()).filter(
          (d) => d.kind === "audioinput" && d.deviceId,
        ),
      );
      setDeviceError("");
    } catch (e) {
      setDeviceError(
        e instanceof Error ? e.message : "Could not list microphones.",
      );
    }
  }
  return (
    <dialog
      ref={dialog}
      className="settings-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      aria-labelledby="settings-title"
    >
      <div className="settings-content">
        <header>
          <div>
            <span className="eyebrow">MAKE YOURSELF AT HOME</span>
            <h2 id="settings-title">Your preferences</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={21} />
          </button>
        </header>
        <div
          className="settings-tabs"
          role="tablist"
          aria-label="Settings sections"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls="settings-body"
              onClick={() => onTab(item.id)}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>
        <div
          className="settings-body"
          id="settings-body"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
        >
          {tab === "connection" && (
            <>
              <h3>A mind for your companion</h3>
              <p>
                Choose a provider configured on your server. Your API keys stay
                there.
              </p>
              <label className="field">
                AI provider
                <select
                  value={settings.provider}
                  onChange={(e) => {
                    const id = e.target.value as Settings["provider"];
                    onChange({
                      provider: id,
                      model:
                        config?.providers.find((p) => p.id === id)?.models[0] ||
                        "",
                    });
                  }}
                >
                  {(
                    config?.providers || [
                      {
                        id: "demo",
                        label: "Offline demo",
                        configured: true,
                        models: ["demo"],
                      },
                    ]
                  ).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                      {!p.configured ? " · needs setup" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Model
                <select
                  value={settings.model}
                  onChange={(e) => onChange({ model: e.target.value })}
                >
                  {provider?.models.length ? (
                    provider.models.map((model) => (
                      <option key={model}>{model}</option>
                    ))
                  ) : (
                    <option value="">Configure a model on your server</option>
                  )}
                </select>
              </label>
              <div className="setup-note">
                {provider?.configured && settings.provider !== "demo" ? (
                  <>
                    <Check size={18} />
                    <span>Provider configured. You’re ready to chat.</span>
                  </>
                ) : (
                  <>
                    <SlidersHorizontal size={18} />
                    <div>
                      <strong>
                        {settings.provider === "demo"
                          ? "You’re in offline demo mode"
                          : "This provider needs a little setup"}
                      </strong>
                      <p>
                        Demo replies are scripted. Copy{" "}
                        <code>.env.example</code> to <code>.env.local</code>,
                        set your provider key, then restart the app.
                      </p>
                      <p>
                        Use <code>OPENAI_API_KEY</code> for text, screen vision,
                        and realtime voice. OpenRouter credentials work for text
                        and vision.
                      </p>
                    </div>
                  </>
                )}
              </div>
              <p className="settings-note">
                This app runs privately on localhost by default. Use an
                authenticated HTTPS host before accessing it over the internet.
              </p>
            </>
          )}
          {tab === "voice" && (
            <>
              <h3>Something more personal</h3>
              <p>
                Realtime conversation uses OpenAI. You can also have text
                replies read aloud.
              </p>
              <Toggle
                label="Read text replies aloud"
                description="Play a spoken response after each text reply."
                checked={settings.speech}
                onChange={(speech) => onChange({ speech })}
              />
              <label className="field">
                Text-to-speech
                <select
                  value={settings.tts}
                  onChange={(e) =>
                    onChange({ tts: e.target.value as Settings["tts"] })
                  }
                >
                  <option value="browser">Browser voice · no API key</option>
                  <option value="openai">
                    OpenAI voice · API key required
                  </option>
                </select>
              </label>
              <label className="field">
                AI voice
                <select
                  value={settings.voice}
                  onChange={(e) => onChange({ voice: e.target.value })}
                >
                  {(config?.voices || ["marin", "coral"]).map((voice) => (
                    <option key={voice}>{voice}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Voice volume <span>{Math.round(settings.volume * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".05"
                  value={settings.volume}
                  onChange={(e) => onChange({ volume: Number(e.target.value) })}
                />
              </label>
              <label className="field">
                Microphone
                <select
                  value={settings.microphone}
                  onChange={(e) => onChange({ microphone: e.target.value })}
                >
                  <option value="default">System default microphone</option>
                  {devices
                    .filter((d) => d.deviceId !== "default")
                    .map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))}
                </select>
              </label>
              <button
                className="subtle-button"
                onClick={() => void refreshDevices()}
              >
                <RefreshCw size={14} /> Refresh microphone list
              </button>
              {deviceError && <p className="error-text">{deviceError}</p>}
              <p className="settings-note">
                The microphone only opens when you start a voice session.
                Changing the voice or microphone ends the current call. Browser
                speech uses your system’s default voice and may use its speech
                service.
              </p>
            </>
          )}
          {tab === "vision" && (
            <>
              <h3>Let me see what you see</h3>
              <p>
                You choose a tab, window, or monitor in your browser’s sharing
                dialog.
              </p>
              <Toggle
                label="Visual analysis"
                description="Allow a frame to be sent when you ask about your screen."
                checked={settings.vision}
                onChange={(vision) => onChange({ vision })}
              />
              <Toggle
                label="Automatic screen observations"
                description="Send a compressed frame periodically while sharing. May incur API costs."
                checked={settings.autoAnalyze}
                onChange={(autoAnalyze) => onChange({ autoAnalyze })}
              />
              <label className="field">
                Capture interval
                <select
                  value={settings.captureInterval}
                  onChange={(e) =>
                    onChange({ captureInterval: Number(e.target.value) })
                  }
                >
                  <option value={15}>Every 15 seconds</option>
                  <option value={30}>Every 30 seconds</option>
                  <option value={60}>Every minute</option>
                  <option value={120}>Every 2 minutes</option>
                </select>
              </label>
              <div className="privacy-note">
                <Eye size={20} />
                <div>
                  <strong>You’re in control.</strong>
                  <p>
                    Frames are resized and sent only to your chosen AI provider.
                    They are never saved in your conversation or browser
                    storage. Your provider’s retention policy still applies.
                    Automatic observations pause during realtime calls; spoken
                    questions can request a fresh frame.
                  </p>
                </div>
              </div>
            </>
          )}
          {tab === "avatar" && (
            <>
              <h3>A little personality</h3>
              <p>Choose who’s keeping you company.</p>
              <div className="character-options">
                {characters.map((c) => (
                  <button
                    key={c.id}
                    className={settings.character === c.id ? "selected" : ""}
                    onClick={() =>
                      onChange({ character: c.id, voice: c.voice })
                    }
                  >
                    <span className="character-initial">{c.name[0]}</span>
                    <strong>{c.name}</strong>
                    <small>{c.description}</small>
                    {settings.character === c.id && <Check size={16} />}
                  </button>
                ))}
              </div>
              {settings.character === "rin" && (
                <p className="settings-note">
                  Rin keeps her original personality and currently shares Mio’s
                  preview artwork.
                </p>
              )}
              <label className="field">
                Avatar style
                <select
                  value={settings.avatar}
                  onChange={(e) =>
                    onChange({ avatar: e.target.value as Settings["avatar"] })
                  }
                >
                  <option value="sprite">Animated expression sprites</option>
                  <option value="portrait">Still portrait</option>
                </select>
              </label>
              <Toggle
                label="Idle animation"
                description="Gentle movement and occasional blinking."
                checked={settings.animation}
                onChange={(animation) => onChange({ animation })}
              />
              <Toggle
                label="Lip sync"
                description="Animate the mouth with speech. Browser voice uses an approximate rhythm."
                checked={settings.lipSync}
                onChange={(lipSync) => onChange({ lipSync })}
              />
              <label className="field">
                Expression intensity{" "}
                <span>{Math.round(settings.expressionIntensity * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".1"
                  value={settings.expressionIntensity}
                  onChange={(e) =>
                    onChange({ expressionIntensity: Number(e.target.value) })
                  }
                />
              </label>
              <p className="settings-note">
                Mio is an original adult character with a shy office-worker
                aesthetic. This version uses generated expression sprites, with
                a future path to a fully rigged Live2D model.
              </p>
            </>
          )}
          {tab === "memory" && (
            <>
              <h3>The little things that matter</h3>
              <p>
                Add facts you’d like your companion to remember. You decide what
                stays.
              </p>
              <Toggle
                label="Use remembered facts"
                description="Include these facts in text and voice conversations."
                checked={settings.memory}
                onChange={(memory) => onChange({ memory })}
              />
              <form
                className="memory-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!fact.trim() || memories.length >= 12) return;
                  onMemories([
                    ...memories,
                    {
                      id: crypto.randomUUID(),
                      text: fact.trim(),
                      createdAt: new Date().toISOString(),
                    },
                  ]);
                  setFact("");
                }}
              >
                <label className="field">
                  Something to remember
                  <input
                    placeholder="For example: avoid spoilers for games I’m playing"
                    maxLength={280}
                    value={fact}
                    onChange={(e) => setFact(e.target.value)}
                  />
                </label>
                <button
                  className="subtle-button"
                  disabled={!fact.trim() || memories.length >= 12}
                >
                  <Plus size={15} /> Remember this
                </button>
              </form>
              <div className="memory-list">
                {memories.length ? (
                  memories.map((memory) => (
                    <div key={memory.id}>
                      <BookHeart size={16} />
                      <p>{memory.text}</p>
                      <button
                        className="icon-button"
                        aria-label={`Forget: ${memory.text}`}
                        onClick={() =>
                          onMemories(memories.filter((m) => m.id !== memory.id))
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="memory-empty">
                    Nothing saved yet. Start with something small.
                  </div>
                )}
              </div>
              <p className="settings-note">
                {memories.length}/12 facts · Stored only in this browser.
                Conversation history is separate. Turning memory off stops
                sending facts without deleting them. Updating facts ends an
                active call.
              </p>
              <div className="destructive-actions">
                <button
                  onClick={() => {
                    if (window.confirm("Clear this character’s conversation?"))
                      onClear();
                  }}
                >
                  <Trash2 size={14} /> Clear conversation
                </button>
                <button
                  disabled={!memories.length}
                  onClick={() => {
                    if (window.confirm("Forget all saved facts?"))
                      onMemories([]);
                  }}
                >
                  <Trash2 size={14} /> Clear saved memory
                </button>
              </div>
            </>
          )}
        </div>
        <footer>
          Made for your own little world.
          <button className="primary-button" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </dialog>
  );
}
