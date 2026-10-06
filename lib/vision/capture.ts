export async function captureFrame(video: HTMLVideoElement) {
  if (!video.videoWidth || video.readyState < 2)
    throw new Error(
      "Your shared screen is still loading. Try again in a moment.",
    );
  const scale = Math.min(
      1,
      1280 / Math.max(video.videoWidth, video.videoHeight),
    ),
    canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot capture screen frames.");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  let quality = 0.72,
    frame = canvas.toDataURL("image/jpeg", quality);
  while (frame.length > 680000 && quality > 0.25) {
    quality -= 0.15;
    frame = canvas.toDataURL("image/jpeg", quality);
  }
  canvas.width = 0;
  canvas.height = 0;
  if (frame.length > 680000)
    throw new Error(
      "Try sharing a smaller window. This frame is too detailed to send.",
    );
  return frame;
}
export function asksAboutScreen(text: string) {
  return /screen|look(?:ing)? at|read this|see this|on (?:my|the) (?:display|monitor)|where (?:should|do|can) I click|this (?:game|error|window)|what.{0,15}happening/i.test(
    text,
  );
}
export function mediaError(error: unknown, device: "microphone" | "screen") {
  if (error instanceof DOMException) {
    if (["NotAllowedError", "PermissionDeniedError"].includes(error.name))
      return `${device === "screen" ? "Screen sharing was canceled or blocked" : "Microphone access was blocked"}. Check your browser permissions and try again when you’re ready.`;
    if (error.name === "NotFoundError")
      return `No ${device === "microphone" ? "microphone" : "shareable screen"} was found.`;
    if (error.name === "NotReadableError")
      return `Your ${device} could not be opened. Check system permissions or whether another app is using it.`;
  }
  return error instanceof Error
    ? error.message
    : `Could not access your ${device}.`;
}
