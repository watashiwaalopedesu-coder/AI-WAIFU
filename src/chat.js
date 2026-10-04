import { character } from './character.js';

export const MAX_MESSAGES = 20;
export const MAX_MESSAGE_LENGTH = 2000;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function validateMessages(messages) {
  if (!Array.isArray(messages) || !messages.length || messages.length > MAX_MESSAGES) {
    throw new HttpError(400, `Send between 1 and ${MAX_MESSAGES} messages.`);
  }
  const clean = messages.map((message) => {
    if (!message || !['user', 'assistant'].includes(message.role)
      || typeof message.content !== 'string' || !message.content.trim()
      || message.content.length > MAX_MESSAGE_LENGTH) {
      throw new HttpError(400, `Messages need a user/assistant role and 1–${MAX_MESSAGE_LENGTH} characters.`);
    }
    return { role: message.role, content: message.content.trim() };
  });
  if (clean.at(-1).role !== 'user') {
    throw new HttpError(400, 'The last message must be from the user.');
  }
  return clean;
}

export function createChatService(env = process.env, fetchImpl = fetch) {
  const mode = env.CHAT_PROVIDER || 'mock';
  if (!['mock', 'openrouter'].includes(mode)) {
    throw new Error('CHAT_PROVIDER must be mock or openrouter.');
  }
  if (mode === 'openrouter' && (!env.OPENROUTER_API_KEY?.trim() || !env.OPENROUTER_MODEL?.trim())) {
    throw new Error('OpenRouter mode requires OPENROUTER_API_KEY and OPENROUTER_MODEL.');
  }

  return {
    mode,
    async reply(input) {
      const messages = validateMessages(input);
      if (mode === 'mock') {
        return `You mentioned “${messages.at(-1).content.slice(0, 160)}”. I’d like to hear more! (This is a scripted demo reply; connect a model for real AI conversation.)`;
      }

      try {
        const response = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: env.OPENROUTER_MODEL,
            messages: [{ role: 'system', content: character.systemPrompt }, ...messages],
            max_tokens: 350,
          }),
          signal: AbortSignal.timeout(30_000),
          redirect: 'error',
        });
        if (!response.ok) throw new Error('Provider request failed.');
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) throw new Error('Empty provider reply.');
        return content.trim().slice(0, MAX_MESSAGE_LENGTH);
      } catch {
        // Do not forward provider payloads or credentials to the browser.
        throw new HttpError(502, 'The AI provider could not reply. Check the server’s key, model, and account balance, then retry.');
      }
    },
  };
}
