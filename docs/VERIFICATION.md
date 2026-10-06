# Verification

The application was installed and checked in the development workspace using Node 24. Final checks were run on October 6, 2026.

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 15 core/API tests passed, using mocked provider responses and no paid calls.
- `npm run build`: production build passed; all four API routes generated as server handlers.
- Headless Chromium browser checks passed for rendering, streamed demo chat, history after refresh, saved facts, saved settings, character switching, missing voice-credential feedback, screen-permission denial feedback and mobile horizontal overflow. No page JavaScript errors were observed.
- Nine additional browser checks passed with simulated media and mocked WebRTC signaling: media remains off on load, a call connects, mute/unmute changes the audio track, a canvas stream appears in the screen preview, a compressed JPEG reaches the realtime channel, no frame enters localStorage, browser Stop Sharing clears capture, ending voice closes the track and peer, and canceling a pending microphone request stops its late-arriving track. These checks do not verify a live provider connection or physical devices.

Desktop (1440 × 1000) and mobile (390 × 844) screenshots were captured for visual review. Browser tests used a locally started production server in the same process environment. The test runner lived outside the product source; the reusable core/API tests are in `test/`.

## Live checks requiring the owner

No live AI-provider credential was supplied. Real provider billing/access, speech latency and audio quality, physical microphone permission, the operating-system screen picker, natural spoken interruptions, and real-world screen recognition must be checked after configuring `.env.local`.

1. Select a configured vision-capable model and send a text message.
2. Start a voice call, grant microphone permission, say a sentence, and hear the response.
3. Confirm the avatar mouth follows audio; mute/unmute; stop and verify the browser microphone indicator goes away.
4. Share a non-sensitive window and ask what is shown. Check preview, reply and frame-analysis indicator.
5. Stop sharing through both the app and browser UI. Neither should continue capture.
6. Enable periodic analysis intentionally, then disable it and verify no further periodic requests occur.

The shipping avatar is generated expression art. Its coarse mouth movement and heuristic emotions are not a full Live2D rig or phoneme system.
