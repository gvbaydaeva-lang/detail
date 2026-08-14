import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestOptions, onRequestPost } from '../functions/api/leads.js';

const env = {
  TELEGRAM_BOT_TOKEN: 'test-token',
  TELEGRAM_CHAT_ID: '-1001234567890',
};

function validLead(overrides = {}) {
  return {
    name: 'Анна',
    phone: '+7 (999) 999-99-99',
    service: 'Полировка кузова',
    request_type: 'Запись',
    comment: 'Toyota Camry',
    page_url: 'https://ls-detailing.ru/services/polirovka-kuzova.html',
    privacy_consent: 'accepted',
    ...overrides,
  };
}

function leadRequest({
  body = validLead(),
  origin = 'https://ls-detailing.ru',
  url = 'https://ls-detailing.ru/api/leads',
  contentType = 'application/json',
  rawBody,
} = {}) {
  return new Request(url, {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': contentType,
    },
    body: rawBody ?? JSON.stringify(body),
  });
}

async function withTelegram(response, callback) {
  const previousFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return response;
  };
  try {
    return await callback(calls);
  } finally {
    globalThis.fetch = previousFetch;
  }
}

test('валидная заявка отправляется в Telegram один раз', async () => {
  await withTelegram(new Response(JSON.stringify({ ok: true }), { status: 200 }), async (calls) => {
    const response = await onRequestPost({ request: leadRequest(), env });

    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.telegram.org/bottest-token/sendMessage');
    const telegramBody = JSON.parse(calls[0].options.body);
    assert.equal(telegramBody.chat_id, '-1001234567890');
    assert.match(telegramBody.text, /Анна/);
    assert.match(telegramBody.text, /\+79999999999/);
    assert.match(telegramBody.text, /Полировка кузова/);
  });
});

test('предварительный запрос с адреса сайта разрешён', async () => {
  const request = new Request('https://ls-detailing.ru/api/leads', {
    method: 'OPTIONS',
    headers: { Origin: 'https://ls-detailing.ru' },
  });
  const response = await onRequestOptions({ request });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://ls-detailing.ru');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
});

test('запрос с чужого сайта отклоняется', async () => {
  await withTelegram(new Response(null, { status: 200 }), async (calls) => {
    const response = await onRequestPost({
      request: leadRequest({ origin: 'https://evil.example' }),
      env,
    });

    assert.equal(response.status, 403);
    assert.equal(calls.length, 0);
  });
});

test('неподдерживаемый формат данных отклоняется', async () => {
  const response = await onRequestPost({
    request: leadRequest({ contentType: 'text/plain' }),
    env,
  });
  assert.equal(response.status, 415);
});

test('повреждённый JSON отклоняется', async () => {
  const response = await onRequestPost({
    request: leadRequest({ rawBody: '{broken' }),
    env,
  });
  assert.equal(response.status, 400);
});

test('заявка без согласия отклоняется', async () => {
  const response = await onRequestPost({
    request: leadRequest({ body: validLead({ privacy_consent: '' }) }),
    env,
  });
  assert.equal(response.status, 422);
  assert.match((await response.json()).error, /согласие/i);
});

test('короткое имя отклоняется', async () => {
  const response = await onRequestPost({
    request: leadRequest({ body: validLead({ name: 'А' }) }),
    env,
  });
  assert.equal(response.status, 422);
});

test('некорректный телефон отклоняется', async () => {
  const response = await onRequestPost({
    request: leadRequest({ body: validLead({ phone: '123' }) }),
    env,
  });
  assert.equal(response.status, 422);
});

test('honeypot отсекает робота без обращения к Telegram', async () => {
  await withTelegram(new Response(null, { status: 200 }), async (calls) => {
    const response = await onRequestPost({
      request: leadRequest({ body: validLead({ website: 'spam.example' }) }),
      env,
    });
    assert.equal(response.status, 202);
    assert.equal(calls.length, 0);
  });
});

test('отсутствующие секреты дают безопасную ошибку', async () => {
  const response = await onRequestPost({
    request: leadRequest(),
    env: {},
  });
  const text = await response.text();

  assert.equal(response.status, 500);
  assert.doesNotMatch(text, /test-token|-1001234567890/);
});

test('ошибка Telegram не раскрывается посетителю', async () => {
  await withTelegram(new Response('private Telegram error', { status: 400 }), async () => {
    const response = await onRequestPost({ request: leadRequest(), env });
    const text = await response.text();

    assert.equal(response.status, 502);
    assert.doesNotMatch(text, /private Telegram error|test-token|-1001234567890/);
  });
});

test('слишком большая заявка отклоняется', async () => {
  const response = await onRequestPost({
    request: leadRequest({ body: validLead({ comment: 'a'.repeat(33 * 1024) }) }),
    env,
  });
  assert.equal(response.status, 413);
});
