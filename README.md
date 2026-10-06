# AI-WAIFU

A private personal AI companion built with Next.js, React, TypeScript and Tailwind CSS. Chat with Mio, an original adult anime office-worker character, or Rin from the original starter. Talk over WebRTC, hear replies, and explicitly share a screen for visual help.

**Status:** working application with a no-key offline demo. Real AI text/vision, OpenAI realtime voice and OpenAI speech require your own provider credentials. The included avatar is an animated expression-sprite system, **not a rigged Live2D model**. The application is intended to run privately on localhost.

## Run it

Install Node.js **24 or newer** and npm. `.nvmrc` selects Node 24.

If you downloaded the source ZIP, extract it and open a terminal in its `AI-WAIFU` folder. If using Git, clone the repository and check out the branch containing this implementation.

```bash
npm ci
npm run dev
```

Open **http://127.0.0.1:3000**. You can try the interface without a key; replies are explicitly labelled scripted demo replies.

Production:

```bash
npm run build
npm start
```

Both scripts bind to localhost. For another local port, use `npm run dev -- --port 3001`. Do not expose the server publicly without authentication; see Privacy below.

## Connect real AI

Copy the environment template:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local` in your editor:

```dotenv
CHAT_PROVIDER=openai
OPENAI_API_KEY=your-own-key-here
OPENAI_CHAT_MODEL=gpt-4.1-mini
OPENAI_MODELS=gpt-4.1-mini
OPENAI_REALTIME_MODEL=gpt-realtime-2.1
OPENAI_TTS_MODEL=gpt-4o-mini-tts
```

Restart the server. In **Settings → Connection**, select OpenAI and the configured model. If you previously saved demo preferences, selecting OpenAI is necessary; changing environment variables does not overwrite your preferences. ChatGPT subscriptions do not provide an API key for this application; configure your API account and available models separately. Do not paste keys into chat, frontend files, screenshots or Git.

| Environment variable | Purpose |
| --- | --- |
| `CHAT_PROVIDER` | `demo`, `openai`, `openrouter`, or `compatible`. Omitted: pick the first configured provider. |
| `OPENAI_API_KEY` | Server-only key for OpenAI text/vision, realtime voice and optional TTS. |
| `OPENAI_CHAT_MODEL` | Default OpenAI text/vision model; defaults to `gpt-4.1-mini`. |
| `OPENAI_MODELS` | Comma-separated allowed text model IDs shown in Settings. |
| `OPENAI_REALTIME_MODEL` | Realtime speech model; defaults to `gpt-realtime-2.1`. |
| `OPENAI_TTS_MODEL` | TTS model; defaults to `gpt-4o-mini-tts`. |
| `OPENROUTER_API_KEY` | Optional server-only OpenRouter key. |
| `OPENROUTER_MODEL` | Required default model when using OpenRouter. Select an image-capable model for vision. |
| `OPENROUTER_MODELS` | Optional comma-separated OpenRouter allowlist; otherwise the default model. |
| `AI_BASE_URL` | Optional compatible API base, e.g. `http://127.0.0.1:11434/v1` for a local server. |
| `AI_API_KEY` | Optional credential for the compatible endpoint. |
| `AI_MODEL`, `AI_MODELS` | Default and allowed models for the compatible endpoint. |

The OpenRouter adapter and Rin character preserve useful functionality from the original starter. A compatible server must implement streaming `/chat/completions`; image support depends on its model. The server owns endpoint URLs and allowed models. There is no frontend secret-key form, and no key is placed in `NEXT_PUBLIC_*` variables.

## Features

- Responsive dark companion studio with a large character stage, chat, visible connection/media states and settings.
- Streaming text chat through OpenAI or OpenRouter, an OpenAI-compatible adapter, and an explicitly labelled offline demo.
- OpenAI realtime speech through WebRTC, including input/output transcripts, voice activity detection, interruption support, mute, stop, connection failures and a 20-minute session limit.
- Browser speech synthesis without an API key, or OpenAI-generated spoken text replies. All voices are disclosed as AI-generated.
- Explicit screen picker for a monitor, application window or tab; local preview; immediate stop; browser Stop Sharing handling.
- Bounded, compressed still-frame vision on request, optional periodic observations, and a realtime screen-observation tool for spoken questions.
- Six generated avatar states, blinking, gentle idle motion, simple emotion inference, audio-amplitude mouth movement, static portrait mode, fallback rendering and reduced-motion support.
- Separate per-character conversation history and user-managed long-term facts, with validated local persistence and bounded model context.
- Settings for providers/models, character, voice, volume, microphone, vision frequency, memory and animation.

## Using voice

Click **Let’s talk** or the microphone button. The microphone is never activated on page load. Grant browser permission; after connecting, speak normally. Mute disables the captured audio track; ending the call stops its tracks and closes the peer connection. Canceling while permission is pending also cleans up any late-arriving track. An active call prevents a separate TTS session from playing over it.

The server exchanges SDP with OpenAI; only the SDP answer reaches the browser. The standard API key stays server-side. Media then flows directly between the browser and OpenAI. Use headphones to minimize acoustic echo. Network/firewall restrictions or browser autoplay rules can prevent a connection or playback; errors appear in the interface.

Realtime voice uses OpenAI even when text chat uses OpenRouter or another server. For reading ordinary text replies, toggle **Read text replies aloud** in Voice settings. Browser TTS uses the system’s default voice; the named AI voice selector applies to OpenAI speech. Browser voice mouth movement is approximate. WebRTC/MP3 mouth movement follows measured amplitude, not phonemes.

## Screen sharing and vision

Click the monitor button, then explicitly choose a capture surface. Sharing alone does not start automatic analysis. In the default mode, select **Include my current screen**, click **Ask about my screen**, or ask a recognized question such as “Can you read this?” or “Where should I click?”. In a realtime call, the model can request a fresh frame when you ask about your screen. It cannot operate the computer.

Frames are JPEG stills with the longest edge capped at 1,280 px. Quality is reduced to keep payloads bounded; no full-resolution video is uploaded. Periodic observations are opt-in with a 15–120 second interval, skip overlapping text requests, and pause during realtime calls. The offline demo cannot interpret frames and does not perform automatic analysis. Disable Visual analysis to keep only the local preview.

Stopping through the app or browser ends the capture tracks. The app never saves frames or recordings in localStorage. Already transmitted frames cannot be recalled from the provider; its own retention policy applies. Select the smallest useful window and avoid sharing secrets. Small text may require a closer view or a smaller capture surface.

## Memory

Each character retains at most 100 visible messages in this browser. Requests include at most 24 recent turns, further limited to 12,000 text characters, plus the bounded character prompt and up to 12 facts of 280 characters each. Older visible messages are not all sent to the model. Context limits use characters, not a tokenizer.

Add or delete facts in **Settings → Memory**. These are explicitly managed facts, not automatic surveillance or semantic memory. Turning memory off stops sending facts without erasing them. Clear conversation and Clear saved memory are separate controls. Switching characters preserves separate histories. Refresh preserves text/preferences, but does not restart microphone or screen sharing. Memory edits end an active call so the next call starts with the updated facts.

## Project map

| Directory/file | Responsibility |
| --- | --- |
| `app/` | App Router pages, metadata, error screen, styling and API routes. |
| `app/api/chat/route.ts` | Validated text/vision request and normalized streaming response. |
| `app/api/realtime/route.ts` | Secure server-side SDP/session exchange. |
| `app/api/speech/route.ts` | Server-side TTS request; streamed audio response. |
| `components/` | Character, chat, voice, screen preview and settings UI. |
| `hooks/use-companion.ts` | Conversation orchestration, persistence and audio coordination. |
| `hooks/use-screen.ts` | Permission-driven screen capture and track lifecycle. |
| `lib/ai/` | Separate provider contracts, demo, compatible adapters and stream parsing. |
| `lib/voice/` | Realtime service, TTS playback and Web Audio level analysis. |
| `lib/vision/` | JPEG capture, compression and user-facing media errors. |
| `lib/avatar/` | AvatarController, normalized state and emotion mapping. |
| `lib/memory/` | History/fact storage interfaces, validation and context limits. |
| `lib/server/` | Request byte caps, origin checks, schemas, configuration and safe errors. |
| `characters/index.ts` | Character personalities, examples, voices, assets and animation settings. |
| `public/avatars/kobeni-inspired/` | Original Mio atlas, metadata and asset replacement structure. |
| `prompts/` | Exact generated-art prompt and templates for future assets. |
| `docs/` | Architecture and verification notes. |
| `test/` | Core and API contract tests with mocked upstream providers. |

## Characters and avatars

Edit `characters/index.ts` to change names, prompts, greetings, personalities, example dialogue, voice, expression maps, emotion profiles, idle timing and lip-sync thresholds. Character configuration is separate from the UI. The two shipped characters currently share Mio’s artwork. To add another selectable character, also add its ID to the settings/request schemas and provide a corresponding greeting/assets; this explicit allowlist keeps untrusted client IDs out of server prompts.

The avatar image is an **original adult character with a timid office-worker aesthetic**, following the Kobeni-inspired alternative in the brief. It is not official Chainsaw Man art. The generated PNG is not a layered PSD or `.moc3` model. Neutral, talking, happy, shy, blink and surprised are real sprite states. Sad/nervous reuse shy; serious uses neutral. Low expression intensity softens these discrete choices; it is not continuous facial deformation.

To replace the atlas, update `public/avatars/kobeni-inspired/expressions/sheet.png` and its dimensions/rectangles in `metadata/manifest.json`, then adjust `expressionMap`. Static mode uses the neutral rectangle. A standalone portrait can omit `sheet` and `atlas` in the character definition. See [the asset pipeline](prompts/avatar-assets.md) for full-body/base concepts, expression prompts, mouth/eye parts and layered rig planning.

A full Live2D upgrade needs aligned layered art, a Cubism rig/export (`.model3.json`, `.moc3`, textures, expression/motion/physics files), appropriate runtime licensing, and a renderer adapter consuming `AvatarState`. `AvatarController` already separates conversation state from rendering. VRM blend shapes or different sprite renderers can use the same boundary.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Tests make no paid AI calls. They cover bounded context, validation, origin checks, request byte caps, UTF-8 stream boundaries, configuration privacy, avatar state, offline streaming, compatible vision payloads, sanitized provider failures, and realtime SDP configuration. [Verification notes](docs/VERIFICATION.md) distinguish automated/browser checks from features still requiring a live API key and physical microphone/screen test.

## Privacy and limitations

- Credentials remain on the server. Browser storage holds unencrypted chat, facts and nonsecret settings on this device; clearing browser storage removes them. Other users with access to this browser profile can read them.
- Microphone and screen permissions require explicit user actions. Screen frames/audio are not written by this app to its database or localStorage. Chosen AI providers receive the content needed to answer; their retention policies apply. Browser TTS may use an OS/vendor service.
- The default app is local-only. Same-origin checks are **not authentication**. Before remote hosting, add an authenticated HTTPS reverse proxy, shared rate/cost limits and an appropriate data policy. No public deployment or user-account system is included.
- Live paid-provider calls could not be verified without your API credentials. Access, billing, model availability and device permissions are your setup steps.
- The avatar uses coarse sprite expressions and amplitude-based mouth movement. Full Live2D/VRM, layered rendering and phoneme lip sync remain future work.
- Emotion inference is a simple replaceable keyword heuristic. Long-term facts are manual. No vector search, automatic memory extraction, cloud sync, wake word, file upload, webcam or computer control is implemented.
- Standalone STT is an interface for future adapters; current microphone transcription is supplied by the realtime service.

**Recommended next feature:** replace the sprite renderer with a properly rigged Live2D model after validating your live voice/vision connection.

Official implementation references: [Next.js App Router](https://nextjs.org/docs/app), [OpenAI WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc?voice-api=realtime), [Realtime conversations](https://developers.openai.com/api/docs/guides/realtime-conversations), and [OpenAI speech](https://developers.openai.com/api/docs/guides/text-to-speech).

No open-source license has been selected; the original repository's licensing status is preserved.
