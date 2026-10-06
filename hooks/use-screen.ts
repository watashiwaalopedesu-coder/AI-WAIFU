"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { captureFrame, mediaError } from "@/lib/vision/capture";
export function useScreen(onError: (message: string) => void) {
  const [stream, setStream] = useState<MediaStream | null>(null),
    [requesting, setRequesting] = useState(false);
  const current = useRef<MediaStream | null>(null),
    video = useRef<HTMLVideoElement | null>(null),
    generation = useRef(0),
    pending = useRef(false);
  const stop = useCallback(() => {
    generation.current++;
    pending.current = false;
    current.current?.getTracks().forEach((t) => t.stop());
    current.current = null;
    if (video.current) {
      video.current.srcObject = null;
      video.current = null;
    }
    setStream(null);
    setRequesting(false);
  }, []);
  const start = useCallback(async () => {
    if (current.current || pending.current) return;
    if (!navigator.mediaDevices?.getDisplayMedia) {
      onError(
        "Screen sharing needs a supported desktop browser on localhost or HTTPS.",
      );
      return;
    }
    const token = ++generation.current;
    pending.current = true;
    setRequesting(true);
    try {
      const capture = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 5, max: 10 } },
        audio: false,
      });
      if (token !== generation.current) {
        capture.getTracks().forEach((t) => t.stop());
        return;
      }
      current.current = capture;
      const element = document.createElement("video");
      element.muted = true;
      element.playsInline = true;
      element.srcObject = capture;
      video.current = element;
      capture
        .getVideoTracks()[0]
        .addEventListener("ended", stop, { once: true });
      await element.play();
      if (token === generation.current) setStream(capture);
    } catch (e) {
      if (token === generation.current) {
        stop();
        onError(mediaError(e, "screen"));
      }
    } finally {
      if (token === generation.current) {
        pending.current = false;
        setRequesting(false);
      }
    }
  }, [onError, stop]);
  const frame = useCallback(async () => {
    if (!video.current || !current.current?.active)
      throw new Error("Share a screen first so your companion can see it.");
    return captureFrame(video.current);
  }, []);
  useEffect(
    () => () => {
      generation.current++;
      current.current?.getTracks().forEach((t) => t.stop());
      if (video.current) video.current.srcObject = null;
    },
    [],
  );
  return { stream, sharing: !!stream, requesting, start, stop, frame };
}
