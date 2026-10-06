# Architecture

The original starter's Rin personality, OpenRouter adapter behavior, offline-demo labeling, bounded context and sanitized failures have been ported to TypeScript. Its former server/frontend remain in Git history.

## Provider boundaries

`TextProvider` and `VisionProvider` normalize text/image requests; the compatible adapter uses Chat Completions SSE. `/api/chat` emits newline-delimited `delta`, `done`, and `error` events. Provider configuration is server-owned. Zod validates requests, model IDs must be configured, and byte readers enforce size limits even without Content-Length. UI rendering uses React text nodes rather than raw HTML.

`RealtimeVoiceProvider` owns WebRTC and track cleanup. The browser supplies an SDP offer, and the server combines it with a character prompt, bounded history/facts, voice settings and an observation-only screen tool. The server authorizes `/v1/realtime/calls`; the client receives an SDP answer, never a standard key. Audio flows through WebRTC; lifecycle and transcript events flow through a data channel. VAD supports natural turns and interruptions.

The `view_current_screen` tool checks current local sharing/vision permission, captures a compressed JPEG and sends it as an image input. It has no keyboard or mouse action. Images are removed from realtime conversation context after the response; this does not override provider retention. Automatic text observations pause during voice calls. Generation guards stop late-arriving streams after canceled permission requests.

`TextToSpeechProvider` supports browser speech or OpenAI audio. `SpeechToTextProvider` is a future standalone adapter contract; current input transcription is part of realtime voice. Separate TTS is prevented during an active call. Stop closes audio contexts, data/peer connections and microphone tracks and cancels signaling. Calls have a 20-minute lifetime.

## State and persistence

- `ai-waifu:v2:settings`: nonsecret preferences.
- `ai-waifu:v2:chat:<character>`: at most 100 visible messages per character.
- `ai-waifu:v2:memories`: up to 12 user-entered facts, 280 characters each.

Frames, audio recordings and provider keys are absent from these stores. Schemas reject corrupted data. Requests include at most 24 turns/12,000 text characters. Facts are separately bounded and quoted as untrusted data. These limits approximate context size rather than counting tokens. Storage interfaces can later use a database or semantic retriever without changing provider/UI contracts.

## Avatar boundary

`AvatarState` consists of activity, emotion, mouth amplitude and blink. `SpriteAvatarController` maps this to configured atlas frames. Web Audio RMS drives mouth opening for realtime/MP3 playback; browser speech uses a timed approximation. Emotion is currently inferred from text with a replaceable heuristic. The renderer reads dimensions and frame rectangles from metadata. A future Cubism adapter can apply the same state to eye/mouth/angle parameters; VRM can apply it to blend shapes. Layered assets, meshes and rigs are not synthesized by the image generator.

## Deployment

The scripts bind to `127.0.0.1`; localhost permits microphone/screen browser APIs. Remote access requires HTTPS and authentication before exposing paid routes. Origin validation helps with browser CSRF but does not authenticate arbitrary clients. No hosting provider or public deployment is provisioned as part of this repository deliverable.
