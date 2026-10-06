"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { UserRound } from "lucide-react";
import { SpriteAvatarController } from "@/lib/avatar/controller";
import type { Activity, Character, Emotion, Settings } from "@/types/companion";
export function Avatar({
  character,
  activity,
  emotion,
  level,
  settings,
}: {
  character: Character;
  activity: Activity;
  emotion: Emotion;
  level: number;
  settings: Settings;
}) {
  const [blink, setBlink] = useState(false),
    [failed, setFailed] = useState(false),
    [frame, setFrame] = useState(0);
  const controller = useRef(new SpriteAvatarController());
  useEffect(() => {
    const image = new window.Image();
    image.onload = () => setFailed(false);
    image.onerror = () => setFailed(true);
    image.src = character.avatar.sheet || character.avatar.base;
  }, [character]);
  useEffect(() => {
    if (!settings.animation || settings.avatar === "portrait") return;
    let end: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setBlink(true);
      end = setTimeout(() => setBlink(false), character.idle.blinkMs);
    }, character.idle.intervalMs);
    return () => {
      clearInterval(timer);
      clearTimeout(end);
    };
  }, [settings.animation, settings.avatar, character]);
  useEffect(() => {
    controller.current.update({
      activity,
      emotion:
        settings.expressionIntensity <= 0.1
          ? "neutral"
          : settings.expressionIntensity < 0.5 &&
              ["shy", "sad", "nervous"].includes(emotion)
            ? "neutral"
            : settings.expressionIntensity < 0.5 && emotion === "surprised"
              ? "happy"
              : emotion,
      mouth: settings.lipSync ? level : 0,
      blink: settings.animation && blink,
    });
    setFrame(
      settings.avatar === "portrait" ? 0 : controller.current.frame(character),
    );
  }, [activity, emotion, level, blink, settings, character]);
  const atlas = character.avatar.atlas,
    { x, y } = atlas?.frames[frame] || atlas?.frames[0] || { x: 0, y: 0 };
  const style: CSSProperties = {
    backgroundImage: `url("${character.avatar.sheet || character.avatar.base}")`,
    backgroundSize: atlas
      ? `${(atlas.width / atlas.frameWidth) * 100}% ${(atlas.height / atlas.frameHeight) * 100}%`
      : "contain",
    backgroundPosition: atlas
      ? `${(x / (atlas.width - atlas.frameWidth)) * 100}% ${(y / (atlas.height - atlas.frameHeight)) * 100}%`
      : "center bottom",
  };
  return (
    <div
      className={`avatar-wrap ${settings.animation ? "avatar-breathing" : ""}`}
      style={
        atlas ? { aspectRatio: `${atlas.frameWidth}/${atlas.frameHeight}` } : {}
      }
    >
      {failed ? (
        <div
          className="avatar-fallback"
          role="img"
          aria-label={`${character.name} avatar unavailable`}
        >
          <UserRound size={90} />
          <span>{character.name}</span>
          <small>Portrait unavailable</small>
        </div>
      ) : (
        <div
          className="avatar-sprite"
          role="img"
          aria-label={`${character.name}, ${emotion}, ${activity}`}
          style={style}
        />
      )}
    </div>
  );
}
