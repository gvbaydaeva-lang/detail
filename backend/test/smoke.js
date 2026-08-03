import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { createLeadApp } from '../src/app.js';

const directory = await mkdtemp(join(tmpdir(), 'ls-leads-'));
const leadsFile = join(directory, 'leads.ndjson');
const telegramRequests = [];
const app = createLeadApp({
  leadsFile,
  env: {
    ALLOWED_ORIGINS: 'https://ls-detailing.ru',
    IP_HASH_SECRET: 'test-secret',
    RATE_LIMIT_MAX: '50',
    TELEGRAM_BOT_TOKEN: 'test-bot-token',
    TELEGRAM_CHAT_ID: '-1001234567890',
  },
  fetchImpl: async (url, options) => {
    telegramRequests.push({ url, options });
    return { ok: true, status: 200 };
  },
});

async function request({
  appImpl = app,
  method = 'GET',
  url = '/',
  body,
  origin = 'https://ls-detailing.ru',
  contentType = 'application/json',
}) {
  const input = body === undefined ? [] : [Buffer.from(JSON.stringify(body))];
  const req = Readable.from(input);
  req.method = method;
  req.url = url;
  req.headers = {
    origin,
    'content-type': contentType,
    'x-forwarded-for': '127.0.0.1',
  };
  req.socket = { remoteAddress: '127.0.0.1' };

  const result = { status: 200, headers: {}, body: '' };
  const res = {
    setHeader(name, value) {
      result.headers[name] = value;
    },
    writeHead(status, headers = {}) {
      result.status = status;
      Object.assign(result.headers, headers);
    },
    end(value = '') {
      result.body += String(value);
    },
  };

  await appImpl(req, res);
  return {
    ...result,
    json: result.body ? JSON.parse(result.body) : null,
  };
}

const health = await request({ url: '/health' });
assert.equal(health.status, 200);
assert.equal(health.json.ok, true);

const valid = await request({
  method: 'POST',
  url: '/api/leads',
  body: {
    name: 'Анна',
    phone: '+7 (961) 842-22-27',
    service: 'Полировка кузова',
    request_type: 'Запись',
    utm_source: 'yandex',
  },
});
assert.equal(valid.status, 201);
assert.equal(valid.json.ok, true);
assert.match(valid.json.id, /^[0-9a-f-]{36}$/);

const stored = JSON.parse((await readFile(leadsFile, 'utf8')).trim());
assert.equal(stored.name, 'Анна');
assert.equal(stored.phone_normalized, '+79618422227');
assert.equal(stored.utm_source, 'yandex');
assert.equal(stored.source_ip_hash.length, 24);
assert.equal(telegramRequests.length, 1);
assert.equal(telegramRequests[0].url, 'https://api.telegram.org/bottest-bot-token/sendMessage');
const telegramBody = JSON.parse(telegramRequests[0].options.body);
assert.equal(telegramBody.chat_id, '-1001234567890');
assert.match(telegramBody.text, /Новая заявка/);
assert.match(telegramBody.text, /Анна/);
assert.match(telegramBody.text, /\+79618422227/);

const invalid = await request({
  method: 'POST',
  url: '/api/leads',
  body: { name: 'A', phone: '123', service: '' },
});
assert.equal(invalid.status, 422);
assert.ok(invalid.json.fields.name);
assert.ok(invalid.json.fields.phone);
assert.ok(invalid.json.fields.service);
assert.equal(telegramRequests.length, 1);

const forbidden = await request({
  method: 'POST',
  url: '/api/leads',
  origin: 'https://evil.example',
  body: { name: 'Иван', phone: '+79999999999', service: 'Полировка' },
});
assert.equal(forbidden.status, 403);

const fallbackLeadsFile = join(directory, 'telegram-fallback.ndjson');
const fallbackApp = createLeadApp({
  leadsFile: fallbackLeadsFile,
  env: {
    ALLOWED_ORIGINS: 'https://ls-detailing.ru',
    IP_HASH_SECRET: 'test-secret',
    RATE_LIMIT_MAX: '50',
    TELEGRAM_BOT_TOKEN: 'test-bot-token',
    TELEGRAM_CHAT_ID: '-1001234567890',
  },
  fetchImpl: async () => {
    throw new Error('Telegram unavailable');
  },
});

const originalConsoleError = console.error;
const telegramErrors = [];
console.error = (...args) => telegramErrors.push(args.join(' '));
let fallback;
try {
  fallback = await request({
    appImpl: fallbackApp,
    method: 'POST',
    url: '/api/leads',
    body: {
      name: 'Иван Иванов',
      phone: '+7 (999) 999-99-99',
      service: 'Полировка кузова',
      request_type: 'Запись',
    },
  });
} finally {
  console.error = originalConsoleError;
}

assert.equal(fallback.status, 201);
assert.equal(fallback.json.ok, true);
const fallbackStored = JSON.parse((await readFile(fallbackLeadsFile, 'utf8')).trim());
assert.equal(fallbackStored.name, 'Иван Иванов');
assert.equal(fallbackStored.phone_normalized, '+79999999999');
assert.match(telegramErrors.join('\n'), /Telegram lead notification failed/);

console.log('Backend smoke test passed: health, storage, Telegram, validation and CORS.');
