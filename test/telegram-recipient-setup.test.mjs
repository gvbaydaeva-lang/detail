import assert from 'node:assert/strict';
import test from 'node:test';
import { handleRecipientSetup } from '../functions/api/telegram-recipient-setup.js';

const SETUP_KEY = 'one-time-key-with-at-least-32-chars';

function setupRequest(key = SETUP_KEY) {
  return new Request('https://www.ls-detailing.ru/api/telegram-recipient-setup', {
    method: 'POST',
    headers: {
      Origin: 'https://www.ls-detailing.ru',
      'X-Setup-Key': key,
    },
  });
}

const env = {
  TELEGRAM_BOT_TOKEN: 'test-token',
  TELEGRAM_SETUP_KEY: SETUP_KEY,
};

test('возвращает только недавний личный чат, написавший боту', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true,
    result: [
      {
        update_id: 1,
        message: {
          date: 1_787_566_700,
          text: 'тест',
          chat: { id: 123456789, type: 'private', first_name: 'Клиент', username: 'client' },
        },
      },
      {
        update_id: 2,
        message: {
          date: 1_787_566_710,
          text: 'не учитывать',
          chat: { id: -100123, type: 'supergroup', title: 'Группа' },
        },
      },
    ],
  }), { status: 200 });

  try {
    const response = await handleRecipientSetup(
      setupRequest(),
      env,
      globalThis.fetch,
      1_787_566_800
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      candidates: [{
        chat_id: '123456789',
        first_name: 'Клиент',
        username: 'client',
        message: 'тест',
        message_date: 1_787_566_700,
      }],
    });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('неверный одноразовый ключ не обращается к Telegram', async () => {
  const previousFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response(null, { status: 200 });
  };

  try {
    const response = await handleRecipientSetup(
      setupRequest('wrong-key'),
      env,
      globalThis.fetch,
      1_787_566_800
    );

    assert.equal(response.status, 404);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
