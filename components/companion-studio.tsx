"use client";
import { useState, useSyncExternalStore } from "react";
import {
  AlertCircle,
  BookHeart,
  ChevronDown,
  Heart,
  MessageCircle,
  Monitor,
  Pause,
  Play,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useCompanion } from "@/hooks/use-companion";
import { Avatar } from "./character/avatar";
import { AvatarBoundary } from "./character/avatar-boundary";
import { Conversation } from "./chat/conversation";
import { VoiceControls } from "./voice/voice-controls";
import { ScreenPreview } from "./screen/screen-preview";
import { SettingsPanel, type SettingsTab } from "./settings/settings-panel";
const subscribe = () => () => {};
export function CompanionApp() {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return hydrated ? (
    <CompanionStudio />
  ) : (
    <main className="app-loading">
      <Heart size={32} />
      <p>Making a little room for you…</p>
    </main>
  );
}
function CompanionStudio() {
  const app = useCompanion(),
    [settingsOpen, setSettingsOpen] = useState(false),
    [settingsTab, setSettingsTab] = useState<SettingsTab>("connection");
  const openSettings = (tab: SettingsTab = "connection") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };
  const toggleScreen = () => {
    if (app.screen.sharing || app.screen.requesting) app.screen.stop();
    else void app.screen.start();
  };
  const toggleVoice = () => {
    if (app.voiceActive) app.stopVoice();
    else void app.startVoice();
  };
  const activeProvider = app.config?.providers.find(
    (p) => p.id === app.settings.provider,
  );
  return (
    <div className="app-shell">
      <aside className="side-rail" aria-label="App navigation">
        <a href="#" className="brand-symbol" aria-label="AI-WAIFU home">
          <Heart size={23} fill="currentColor" />
        </a>
        <nav>
          <button
            className="rail-button selected"
            aria-label="Conversation"
            onClick={() => setSettingsOpen(false)}
          >
            <MessageCircle size={21} />
          </button>
          <button
            className="rail-button"
            aria-label="Remembered facts"
            onClick={() => openSettings("memory")}
          >
            <BookHeart size={21} />
          </button>
        </nav>
        <div className="rail-bottom">
          <button
            className="rail-button"
            aria-label="Settings"
            onClick={() => openSettings()}
          >
            <Settings2 size={21} />
          </button>
          <div className="user-initial" title="Your local space">
            A
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="wordmark">
            AI<span>—</span>WAIFU<small>COMPANION STUDIO</small>
          </div>
          <div className="topbar-right">
            <span className="private-status">
              <ShieldCheck size={14} /> Private space
            </span>
            <button
              className={`connection-badge ${app.settings.provider === "demo" ? "demo" : ""}`}
              onClick={() => openSettings("connection")}
            >
              <span className="status-dot" />
              {app.config
                ? app.settings.provider === "demo"
                  ? "Offline demo"
                  : activeProvider?.configured
                    ? activeProvider.label
                    : "Setup needed"
                : "Connecting…"}
              <ChevronDown size={12} />
            </button>
          </div>
        </header>
        <main className="studio-grid">
          <section className="character-column" aria-label="Companion">
            <div className="character-stage">
              <div className="stage-top">
                <span className="eyebrow">
                  <span className="small-spark">✦</span> YOUR COMPANION
                </span>
                <button
                  className="stage-character-picker"
                  onClick={() => openSettings("avatar")}
                >
                  {app.character.name}
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="stage-halo" />
              <span className="stage-watermark" aria-hidden="true">
                {app.character.name.toUpperCase()}
              </span>
              <span className="stage-caption" aria-hidden="true">
                A LITTLE CLOSER.
              </span>
              <div className="stage-character">
                <AvatarBoundary
                  key={app.character.id}
                  name={app.character.name}
                >
                  <Avatar
                    character={app.character}
                    activity={app.activity}
                    emotion={app.emotion}
                    level={app.level}
                    settings={app.settings}
                  />
                </AvatarBoundary>
              </div>
              <div className="stage-bottom">
                <div className="character-name">
                  <div className="character-mood">
                    <span />
                    {app.activity === "thinking"
                      ? "Gathering my thoughts"
                      : app.activity === "listening"
                        ? "You have my attention"
                        : app.activity === "speaking"
                          ? "A thought for you"
                          : app.emotion === "happy"
                            ? "Happy to see you"
                            : app.emotion === "shy"
                              ? "Just a little bashful"
                              : "Here with you"}
                  </div>
                  <h1>
                    {app.character.displayName}
                    <span>COMPANION</span>
                  </h1>
                  <p>{app.character.description}</p>
                </div>
                <button
                  className="stage-pause"
                  onClick={() =>
                    app.changeSettings({ animation: !app.settings.animation })
                  }
                  aria-label={
                    app.settings.animation
                      ? "Pause avatar animation"
                      : "Resume avatar animation"
                  }
                >
                  {app.settings.animation ? (
                    <Pause size={17} />
                  ) : (
                    <Play size={17} />
                  )}
                </button>
              </div>
            </div>
            <VoiceControls
              activity={app.activity}
              voiceActive={app.voiceActive}
              muted={app.muted}
              onStart={() => void app.startVoice()}
              onEnd={app.stopVoice}
              onMute={app.toggleMute}
              onStop={app.stop}
              disabled={app.busy || !app.config}
            />
            <div className="presence-strip">
              <span
                className={
                  app.voiceActive && !app.muted ? "privacy-active" : ""
                }
              >
                <span className="status-dot" />
                {app.voiceActive
                  ? app.muted
                    ? "Mic muted"
                    : app.activity === "connecting"
                      ? "Mic connecting"
                      : "Mic active"
                  : "Mic off"}
              </span>
              <button onClick={toggleScreen}>
                <Monitor size={13} />
                {app.screen.sharing
                  ? "Screen shared"
                  : app.screen.requesting
                    ? "Choosing screen…"
                    : "Screen not shared"}
              </button>
              <span>
                <BookHeart size={13} />
                {app.settings.memory ? "Memory on" : "Memory off"}
              </span>
            </div>
          </section>
          <div className="chat-column">
            {app.settings.provider === "demo" && (
              <div className="demo-banner">
                <Sparkles size={16} />
                <span>A quiet corner, ready for your AI.</span>
                <button onClick={() => openSettings("connection")}>
                  Connect a model
                </button>
              </div>
            )}
            {app.error && (
              <div className="error-banner" role="alert">
                <AlertCircle size={18} />
                <p>{app.error}</p>
                <button
                  className="icon-button"
                  onClick={app.dismissError}
                  aria-label="Dismiss error"
                >
                  <X size={17} />
                </button>
              </div>
            )}
            {app.screen.stream && (
              <ScreenPreview
                stream={app.screen.stream}
                analyzing={app.analyzing}
                auto={
                  app.settings.autoAnalyze &&
                  app.settings.vision &&
                  app.settings.provider !== "demo" &&
                  !app.voiceActive
                }
                onStop={app.screen.stop}
                onAsk={() =>
                  void app.send("What am I looking at on my screen?", true)
                }
                disabled={
                  app.busy ||
                  !app.settings.vision ||
                  app.activity === "connecting"
                }
              />
            )}
            <Conversation
              messages={app.messages}
              character={app.character}
              busy={app.busy}
              voiceActive={app.voiceActive}
              connecting={app.activity === "connecting" || !app.config}
              sharing={app.screen.sharing}
              vision={app.settings.vision}
              analyzing={app.analyzing}
              onSend={(text, screen) => void app.send(text, screen)}
              onVoice={toggleVoice}
              onScreen={toggleScreen}
              onStop={app.stop}
              onSpeak={(text) => void app.speak(text)}
              onSettings={() => openSettings("memory")}
            />
          </div>
        </main>
        <footer className="app-footer">
          <span>A little company goes a long way.</span>
          <span>
            AI-WAIFU <i /> Made to feel close
          </span>
        </footer>
      </div>
      <SettingsPanel
        open={settingsOpen}
        tab={settingsTab}
        onTab={setSettingsTab}
        onClose={() => setSettingsOpen(false)}
        settings={app.settings}
        onChange={app.changeSettings}
        config={app.config}
        memories={app.memories}
        onMemories={app.saveMemories}
        onClear={app.clearConversation}
      />
    </div>
  );
}
