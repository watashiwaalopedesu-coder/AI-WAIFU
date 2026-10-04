const elements = Object.fromEntries([
  'character-name', 'character-description', 'avatar', 'mode', 'privacy',
  'messages', 'chat-form', 'message', 'send', 'reset', 'status',
].map((id) => [id, document.getElementById(id)]));
let character;
let messages = [];
let busy = false;

function setBusy(value) {
  busy = value;
  for (const id of ['message', 'send', 'reset']) elements[id].disabled = value;
}

function addMessage(role, content) {
  const item = document.createElement('article');
  item.className = `message ${role}`;
  const author = document.createElement('strong');
  author.textContent = role === 'user' ? 'You' : character.name;
  const text = document.createElement('p');
  // Treat all model and user output as text, never executable HTML.
  text.textContent = content;
  item.append(author, text);
  elements.messages.append(item);
  elements.messages.scrollTop = elements.messages.scrollHeight;
  return item;
}

function resetChat() {
  messages = [{ role: 'assistant', content: character.greeting }];
  elements.messages.replaceChildren();
  addMessage('assistant', character.greeting);
  elements.message.value = '';
  elements.status.textContent = '';
  elements.message.focus();
}

elements.reset.addEventListener('click', resetChat);
elements.message.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    elements['chat-form'].requestSubmit();
  }
});
elements['chat-form'].addEventListener('submit', async (event) => {
  event.preventDefault();
  const content = elements.message.value.trim();
  if (busy || !character || !content) return;
  const pending = [...messages.slice(-19), { role: 'user', content }];
  const outgoing = addMessage('user', content);
  elements.message.value = '';
  setBusy(true);
  elements.status.textContent = `${character.name} is replying…`;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: pending }),
      signal: AbortSignal.timeout(35_000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not send your message.');
    messages = [...pending, { role: 'assistant', content: data.reply }].slice(-20);
    addMessage('assistant', data.reply);
    elements.status.textContent = '';
  } catch (error) {
    outgoing.remove();
    elements.message.value = content;
    elements.status.textContent = error.name === 'TimeoutError'
      ? 'The reply took too long. Please retry.' : error.message;
  } finally {
    setBusy(false);
    elements.message.focus();
  }
});

try {
  const response = await fetch('/api/character');
  if (!response.ok) throw new Error('Character could not load. Refresh to retry.');
  character = await response.json();
  elements['character-name'].textContent = character.name;
  elements['character-description'].textContent = character.description;
  elements.avatar.textContent = character.name.slice(0, 1);
  elements.mode.textContent = character.mode === 'mock' ? 'Demo · scripted replies' : 'AI · OpenRouter';
  elements.privacy.textContent = character.mode === 'mock'
    ? 'Demo runs locally with scripted replies. Chat is kept in this tab only and clears on refresh.'
    : 'Your recent messages are sent to OpenRouter and its model provider. This app does not save chat history; provider retention policies still apply.';
  setBusy(false);
  resetChat();
} catch {
  elements['character-description'].textContent = 'Unable to load the character.';
  elements.mode.textContent = 'Offline';
  elements.status.textContent = 'Check that the server is running, then refresh.';
}
