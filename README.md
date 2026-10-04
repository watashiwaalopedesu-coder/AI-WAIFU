# AI-WAIFU

A small, customizable AI character chat app. Start a conversation with Rin, edit her character definition, and optionally connect an AI model through OpenRouter.

**Status: working local starter.** The default mode uses clearly labeled, scripted demo replies. Real AI replies require your own OpenRouter API key and model selection.

## What is included

- Responsive browser chat with a character profile, send state, error messages, and a new-conversation button.
- One editable character: name, description, greeting, and system prompt.
- Offline demo mode that makes no external API requests.
- Optional server-side OpenRouter integration, with a 30-second provider timeout.
- Input validation, bounded request sizes, and text-only rendering of chat messages.
- No third-party runtime or development dependencies, bundler, database, or build step.

## Quick start

Install [Node.js 24 or newer](https://nodejs.org/en/download), which includes npm, and Git. `.nvmrc` selects Node 24 if you use nvm.

```bash
git clone https://github.com/watashiwaalopedesu-coder/AI-WAIFU.git
cd AI-WAIFU
npm start
```

Open **http://127.0.0.1:3000**. No API key, `.env` file, or `npm install` is needed for demo mode. Node may print an informational notice that `.env` is missing; the app still starts normally.

Use `npm run dev` to restart the server automatically when imported server files change. Refresh the browser after editing frontend files. Stop the server with `Ctrl+C`.

## Enable real AI replies

1. Copy `.env.example` to `.env` in the project root. Use `cp .env.example .env` on macOS/Linux or `Copy-Item .env.example .env` in PowerShell.
2. Set `CHAT_PROVIDER=openrouter`, add your `OPENROUTER_API_KEY`, and set `OPENROUTER_MODEL` to a model ID from the [OpenRouter catalog](https://openrouter.ai/models).
3. Restart with `npm start` and refresh the browser. The profile badge should say **AI · OpenRouter**.

| Setting | Default | Purpose |
| --- | --- | --- |
| `CHAT_PROVIDER` | `mock` | Choose `mock` or `openrouter`. |
| `PORT` | `3000` | Local server port; use another available port if needed. |
| `OPENROUTER_API_KEY` | Empty | Server-only credential, required in OpenRouter mode. |
| `OPENROUTER_MODEL` | Empty | Your chosen model ID, required in OpenRouter mode. |

Choose a model and review its pricing before sending live messages. Your recent conversation is sent to OpenRouter and its selected model provider in live mode. Their data-retention policies apply. The app sends at most 20 recent messages plus the character's system prompt; each message is limited to 2,000 characters. Older messages remain visible in the tab but are no longer included in model context.

The integration follows the [OpenRouter quickstart](https://openrouter.ai/docs/quickstart). Keys remain on the Node server. Never place a real key in `public/`, source files, screenshots, or commits. `.env` files are ignored by Git; `.env.example` intentionally contains only placeholders.

## Customize the character

Edit `src/character.js`:

- `name` and `description` appear in the profile.
- `greeting` starts each new conversation.
- `systemPrompt` guides the live AI model's behavior.

Restart the server and refresh the page to see changes. Demo replies are scripted in `src/chat.js`; they do not interpret the system prompt. Change colors and layout in `public/styles.css`.

## Project files

| File | Responsibility |
| --- | --- |
| `README.md` | Project overview, setup, configuration, architecture, and limitations. |
| `package.json` | Project metadata, Node requirement, and start/dev/check/test commands. |
| `package-lock.json` | npm lockfile; currently records the dependency-free package. |
| `.nvmrc` | Node 24 selection for nvm users. |
| `.env.example` | Safe template for local settings and API credentials. |
| `.gitignore` | Excludes local secrets, dependencies, logs, and generated coverage. |
| `src/character.js` | The editable starter character and server-owned system prompt. |
| `src/chat.js` | Message validation, scripted demo replies, and OpenRouter adapter. |
| `src/server.js` | Local HTTP server, static-file allowlist, JSON endpoints, and request limits. |
| `public/index.html` | Accessible chat page and character-profile markup. |
| `public/app.js` | Browser conversation state, API calls, safe text rendering, and error recovery. |
| `public/styles.css` | Responsive desktop/mobile appearance. |
| `test/app.test.js` | API integration tests, input checks, and mocked provider success/failure tests. |

The browser requests the public character profile from `GET /api/character`, then sends `{ "messages": [{ "role": "user", "content": "Hello" }] }` to `POST /api/chat`. The server validates messages, adds the character prompt in live mode, and returns `{ "reply": "..." }`. Only the three frontend assets are served publicly; server files and `.env` are not served.

## Verify changes

```bash
npm run check
npm test
```

The checks require no credentials and make no external requests. Tests exercise the real local HTTP endpoints and a mocked OpenRouter adapter; they do not verify a paid model or a live API key. For a browser smoke check, start the app, send a message, confirm the demo label, and use **New conversation** to reset it.

## Scope and next steps

This starter binds to `127.0.0.1` and accepts local same-origin requests. It is intended for local development. Chat history exists only in browser memory and disappears on refresh or reset; the server does not persist or log conversations.

Possible next steps are streaming responses, more character profiles, opt-in saved conversations, and voice support. Before public hosting, add authentication, rate limits and cost controls, deployment configuration, and an explicit retention policy. Accounts, long-term memory, character-card imports, voice, and public deployment are not included yet.

No open-source license has been selected for this repository.
