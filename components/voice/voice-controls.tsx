import {
  Headphones,
  Mic,
  MicOff,
  PhoneOff,
  Square,
  Volume2,
} from "lucide-react";
import type { Activity } from "@/types/companion";
const labels: Record<Activity, string> = {
  idle: "Ready when you are",
  connecting: "Connecting…",
  listening: "Listening to you",
  "user-speaking": "You’re speaking",
  thinking: "Thinking…",
  speaking: "Speaking",
  error: "Let’s try again",
};
export function VoiceControls({
  activity,
  voiceActive,
  muted,
  onStart,
  onEnd,
  onMute,
  onStop,
  disabled,
}: {
  activity: Activity;
  voiceActive: boolean;
  muted: boolean;
  onStart: () => void;
  onEnd: () => void;
  onMute: () => void;
  onStop: () => void;
  disabled: boolean;
}) {
  return (
    <div className="voice-dock">
      <div className={`voice-state ${voiceActive ? "is-live" : ""}`}>
        <span className="voice-state-icon">
          {activity === "speaking" ? (
            <Volume2 size={18} />
          ) : voiceActive ? (
            <Mic size={18} />
          ) : (
            <Headphones size={18} />
          )}
        </span>
        <div>
          <strong>{muted ? "Microphone muted" : labels[activity]}</strong>
          <small>
            {voiceActive
              ? "Live voice session"
              : "A familiar voice, one click away"}
          </small>
        </div>
      </div>
      {voiceActive ? (
        <div className="voice-actions">
          <button
            className="icon-button"
            onClick={onMute}
            aria-label={muted ? "Unmute microphone" : "Mute microphone"}
            disabled={activity === "connecting"}
          >
            {muted ? <MicOff size={19} /> : <Mic size={19} />}
          </button>
          <button
            className="icon-button danger"
            onClick={onEnd}
            aria-label="End voice session"
          >
            <PhoneOff size={19} />
          </button>
        </div>
      ) : activity === "speaking" ? (
        <button className="subtle-button" onClick={onStop}>
          <Square size={15} /> Stop voice
        </button>
      ) : (
        <button
          className="primary-button"
          onClick={onStart}
          disabled={disabled}
        >
          <Headphones size={16} /> Let’s talk
        </button>
      )}
    </div>
  );
}
