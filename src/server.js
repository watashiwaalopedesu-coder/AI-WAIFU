import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { character } from './character.js';
import { createChatService, HttpError } from './chat.js';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
]);

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > 64 * 1024) {
        chunks.length = 0;
        reject(new HttpError(413, 'Request body is too large.'));
      } else {
        chunks.push(chunk);
      }
    });
    request.on('end', () => {
      if (size > 64 * 1024) return;
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'Request body must be valid JSON.'));
      }
    });
    request.on('error', reject);
    request.on('aborted', () => reject(new HttpError(400, 'Request was interrupted.')));
  });
}

export function createApp({ env = process.env, fetchImpl = fetch } = {}) {
  const chat = createChatService(env, fetchImpl);
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");

    try {
      const port = server.address().port;
      const host = request.headers.host;
      if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(host)) {
        throw new HttpError(403, 'Use the local app address.');
      }
      if (request.headers.origin && request.headers.origin !== `http://${host}`) {
        throw new HttpError(403, 'Cross-origin requests are not allowed.');
      }
      const path = new URL(request.url, `http://${host}`).pathname;
      if (request.method === 'GET' && assets.has(path)) {
        const [filename, contentType] = assets.get(path);
        const content = await readFile(new URL(`../public/${filename}`, import.meta.url));
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content);
      } else if (request.method === 'GET' && path === '/api/character') {
        const { name, description, greeting } = character;
        sendJson(response, 200, { name, description, greeting, mode: chat.mode });
      } else if (request.method === 'POST' && path === '/api/chat') {
        if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
          throw new HttpError(415, 'Use Content-Type: application/json.');
        }
        const body = await readJson(request);
        const reply = await chat.reply(body?.messages);
        sendJson(response, 200, { reply });
      } else {
        throw new HttpError(404, 'Not found.');
      }
    } catch (error) {
      sendJson(response, error instanceof HttpError ? error.status : 500, {
        error: error instanceof HttpError ? error.message : 'An unexpected server error occurred.',
      });
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const port = Number(process.env.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('PORT must be an integer between 1 and 65535.');
    }
    const server = createApp();
    server.on('error', (error) => {
      console.error(`Could not start the server (${error.code || 'unknown error'}). Check PORT and retry.`);
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => {
      console.log(`AI-WAIFU is ready at http://127.0.0.1:${port} (${process.env.CHAT_PROVIDER || 'mock'} mode)`);
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
