"use client";
import { useEffect, useRef } from "react";
import { Monitor, ScanEye, X } from "lucide-react";
export function ScreenPreview({
  stream,
  analyzing,
  auto,
  onStop,
  onAsk,
  disabled,
}: {
  stream: MediaStream;
  analyzing: boolean;
  auto: boolean;
  onStop: () => void;
  onAsk: () => void;
  disabled: boolean;
}) {
  const preview = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = preview.current;
    if (!video) return;
    video.srcObject = stream;
    void video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [stream]);
  return (
    <section className="screen-preview" aria-label="Your shared screen">
      <div className="screen-video">
        <video
          ref={preview}
          autoPlay
          muted
          playsInline
          aria-label="Local screen preview"
        />
      </div>
      <div className="screen-preview-copy">
        <span className="live-label">
          <Monitor size={14} /> Screen sharing on
        </span>
        <small>
          {analyzing
            ? "Analyzing a frame…"
            : auto
              ? "Periodic analysis enabled"
              : "Analyzed only when you ask"}
        </small>
        <button className="text-button" onClick={onAsk} disabled={disabled}>
          <ScanEye size={14} /> Ask about my screen
        </button>
      </div>
      <button
        className="icon-button"
        title="Stop sharing"
        aria-label="Stop sharing"
        onClick={onStop}
      >
        <X size={17} />
      </button>
    </section>
  );
}
