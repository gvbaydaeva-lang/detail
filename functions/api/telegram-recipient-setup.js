const RECENT_MESSAGE_SECONDS = 15 * 60;

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

function authorized(request, env) {
  const expected = String(env?.TELEGRAM_SETUP_KEY || '');
  const supplied = request.headers.get('X-Setup-Key') || '';
  return expected.length >= 32 && supplied === expected;
}

async function handleRecipientSetup(
  request,
  env,
  fetchImpl,
  nowSeconds = Math.floor(Date.now() / 1000)
) {
  const origin = request.headers.get('Origin') || '';
  if (origin !== new URL(request.url).origin || !authorized(request, env)) {
    return jsonResponse(404, { ok: false });
  }

  const token = String(env?.TELEGRAM_BOT_TOKEN || '').trim();
  if (!token) return jsonResponse(503, { ok: false });

  try {
    const botResponse = await fetchImpl(
      `https://api.telegram.org/bot${token}/getMe`,
      { method: 'GET', signal: AbortSignal.timeout(8_000) }
    );
    if (!botResponse.ok) return jsonResponse(502, { ok: false });

    const botBody = await botResponse.json();
    const botUsername = String(botBody?.result?.username || '').slice(0, 80);
    if (!botBody?.ok || !botUsername) return jsonResponse(502, { ok: false });

    const telegramResponse = await fetchImpl(
      `https://api.telegram.org/bot${token}/getUpdates?offset=-20&limit=20&timeout=0&allowed_updates=%5B%22message%22%5D`,
      { method: 'GET', signal: AbortSignal.timeout(8_000) }
    );
    if (!telegramResponse.ok) return jsonResponse(502, { ok: false });

    const telegramBody = await telegramResponse.json();
    if (!telegramBody?.ok || !Array.isArray(telegramBody.result)) {
      return jsonResponse(502, { ok: false });
    }

    const candidates = telegramBody.result
      .map((update) => update?.message)
      .filter((message) => (
        message?.chat?.type === 'private' &&
        Number.isFinite(message.date) &&
        message.date >= nowSeconds - RECENT_MESSAGE_SECONDS
      ))
      .sort((a, b) => b.date - a.date)
      .map((message) => ({
        chat_id: String(message.chat.id),
        first_name: String(message.chat.first_name || '').slice(0, 80),
        username: String(message.chat.username || '').slice(0, 80),
        message: String(message.text || '').slice(0, 80),
        message_date: message.date,
      }));

    return jsonResponse(200, { ok: true, bot_username: botUsername, candidates });
  } catch {
    return jsonResponse(502, { ok: false });
  }
}

export async function onRequestPost({ request, env }) {
  return handleRecipientSetup(request, env, globalThis.fetch);
}

export { handleRecipientSetup };
