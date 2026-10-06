"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUp,
  Headphones,
  Mic,
  Monitor,
  ScanEye,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";
import type { Character, Message } from "@/types/companion";
export function Conversation({
  messages,
  character,
  busy,
  voiceActive,
  connecting,
  sharing,
  vision,
  analyzing,
  onSend,
  onVoice,
  onScreen,
  onStop,
  onSpeak,
  onSettings,
}: {
  messages: Message[];
  character: Character;
  busy: boolean;
  voiceActive: boolean;
  connecting: boolean;
  sharing: boolean;
  vision: boolean;
  analyzing: boolean;
  onSend: (text: string, screen?: boolean) => void;
  onVoice: () => void;
  onScreen: () => void;
  onStop: () => void;
  onSpeak: (text: string) => void;
  onSettings: () => void;
}) {
  const [text, setText] = useState(""),
    [attach, setAttach] = useState(false);
  const end = useRef<HTMLDivElement>(null),
    scroll = useRef<HTMLDivElement>(null),
    follow = useRef(true);
  useEffect(() => {
    if (follow.current)
      end.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [messages]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy || connecting) return;
    onSend(text, attach && sharing && vision);
    setText("");
    setAttach(false);
    follow.current = true;
  };
  return (
    <section className="conversation" aria-label="Conversation">
      <div className="conversation-header">
        <div>
          <span className="eyebrow">THE TWO OF YOU</span>
          <h2>Stay a little.</h2>
        </div>
        <button
          className="icon-button"
          title="Conversation settings"
          aria-label="Conversation settings"
          onClick={onSettings}
        >
          <span className="ellipsis">•••</span>
        </button>
      </div>
      <div
        className="message-scroll"
        ref={scroll}
        onScroll={() => {
          const el = scroll.current;
          if (el)
            follow.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className="conversation-date">
          <span /> YOUR SPACE, YOUR PACE <span />
        </div>
        {messages.map((message) => (
          <article
            key={message.id}
            className={`message message-${message.role} ${message.failed ? "message-failed" : ""}`}
          >
            {message.role === "assistant" && (
              <div className="message-avatar">{character.name[0]}</div>
            )}
            <div className="message-main">
              <div className="message-byline">
                <strong>
                  {message.role === "assistant" ? character.name : "You"}
                </strong>
                <time>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
                {message.source === "voice" && <Mic size={12} />}
              </div>
              <div className="message-bubble">
                {message.screen && (
                  <span className="frame-tag">
                    <ScanEye size={12} /> A screen frame was shared
                  </span>
                )}
                {message.content || (
                  <span className="typing-dots" aria-label="Thinking">
                    •••
                  </span>
                )}
                {message.failed && (
                  <small className="incomplete">Reply interrupted</small>
                )}
              </div>
              {message.role === "assistant" && !!message.content && (
                <button
                  className="message-play"
                  onClick={() => onSpeak(message.content)}
                  disabled={busy || voiceActive}
                  aria-label={`Read ${character.name}'s message aloud`}
                >
                  <Volume2 size={14} />
                </button>
              )}
            </div>
          </article>
        ))}
        <div ref={end} />
      </div>
      {messages.length < 3 && (
        <div className="conversation-starters">
          <button
            onClick={() => onSend("Let’s get to know each other.")}
            disabled={busy || connecting}
          >
            <Sparkles size={14} /> Get to know each other
          </button>
          <button onClick={onScreen} disabled={connecting}>
            <Monitor size={14} /> Show you something
          </button>
        </div>
      )}
      <form className="composer" onSubmit={submit}>
        {sharing && vision && (
          <label className="attach-screen">
            <input
              type="checkbox"
              checked={attach}
              onChange={(e) => setAttach(e.target.checked)}
            />
            <ScanEye size={14} /> Include my current screen{" "}
            {analyzing && <span>· Analyzing…</span>}
          </label>
        )}
        <textarea
          aria-label={`Message ${character.name}`}
          placeholder={`Say something to ${character.name}…`}
          value={text}
          maxLength={4000}
          rows={2}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <div className="composer-tools">
          <div>
            <button
              type="button"
              className={`icon-button ${voiceActive ? "active" : ""}`}
              aria-label={
                voiceActive ? "End voice session" : "Start voice conversation"
              }
              onClick={onVoice}
              disabled={busy}
            >
              <Mic size={19} />
            </button>
            <button
              type="button"
              className={`icon-button ${sharing ? "active" : ""}`}
              aria-label={sharing ? "Stop screen sharing" : "Share screen"}
              onClick={onScreen}
            >
              <Monitor size={19} />
            </button>
            <span className="composer-divider" />
            <span className="composer-hint">
              {voiceActive
                ? "Voice conversation active"
                : "Just you and a little company"}
            </span>
          </div>
          {busy ? (
            <button
              type="button"
              className="send-button"
              aria-label="Stop response"
              onClick={onStop}
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              className="send-button"
              aria-label="Send message"
              disabled={!text.trim() || connecting}
            >
              <ArrowUp size={21} />
            </button>
          )}
        </div>
      </form>
      <div className="composer-footnote">
        <Headphones size={12} /> AI companion · Voices are AI-generated{" "}
        <span>Enter to send</span>
      </div>
    </section>
  );
}
