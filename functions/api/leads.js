const MAX_BODY_BYTES = 32 * 1024;
const TELEGRAM_MESSAGE_LIMIT = 4096;
const REQUEST_TYPES = new Set([
  'Консультация',
  'Запись',
  'Обратный звонок',
  'consultation',
  'booking',
  'estimate',
]);

function cleanString(value, maxLength = 500) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizePhone(value) {
  const raw = cleanString(value, 40);
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  return {
    display: raw,
    normalized: digits ? `+${digits}` : '',
    valid: digits.length >= 11 && digits.length <= 15,
  };
}

function responseHeaders(origin = '') {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
  };
}

function jsonResponse(status, payload, origin = '') {
  return new Response(JSON.stringify(payload), {
    status,
    headers: responseHeaders(origin),
  });
}

function sameOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  return origin && origin === new URL(request.url).origin ? origin : '';
}

function validateLead(body) {
  const name = cleanString(body.name, 80);
  const phone = normalizePhone(body.phone);
  const service = cleanString(body.service, 120);
  const requestType = cleanString(body.request_type, 40) || 'Консультация';

  if (body.privacy_consent !== 'accepted') {
    return { error: 'Необходимо согласие на обработку персональных данных.' };
  }
  if (name.length < 2) return { error: 'Укажите имя длиной не менее 2 символов.' };
  if (!phone.valid) return { error: 'Укажите корректный номер телефона.' };
  if (!service) return { error: 'Укажите интересующую услугу.' };
  if (!REQUEST_TYPES.has(requestType)) return { error: 'Укажите корректный тип обращения.' };

  return {
    lead: {
      name,
      phone: phone.normalized,
      service,
      request_type: requestType,
      comment: cleanString(body.comment, 1500),
      page_url: cleanString(body.page_url, 500),
      utm_source: cleanString(body.utm_source, 120),
      utm_medium: cleanString(body.utm_medium, 120),
      utm_campaign: cleanString(body.utm_campaign, 160),
    },
  };
}

function formatTelegramLead(lead) {
  const lines = [
    'Новая заявка с сайта LS Detailing',
    `Тип: ${lead.request_type}`,
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    `Услуга: ${lead.service}`,
  ];
  if (lead.comment) lines.push(`Комментарий: ${lead.comment}`);
  if (lead.page_url) lines.push(`Страница: ${lead.page_url}`);
  const utm = [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(' / ');
  if (utm) lines.push(`Источник: ${utm}`);
  return lines.join('\n').slice(0, TELEGRAM_MESSAGE_LIMIT);
}

async function handleOptions(request) {
  const origin = sameOrigin(request);
  if (!origin) return jsonResponse(403, { ok: false, error: 'Источник запроса запрещён.' });
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Cache-Control': 'no-store',
      Vary: 'Origin',
    },
  });
}

async function handleLeadRequest(request, env, fetchImpl) {
  const origin = sameOrigin(request);
  if (!origin) return jsonResponse(403, { ok: false, error: 'Источник запроса запрещён.' });

  const contentType = request.headers.get('Content-Type')?.toLowerCase() || '';
  if (!contentType.startsWith('application/json')) {
    return jsonResponse(415, { ok: false, error: 'Ожидаются данные JSON.' }, origin);
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return jsonResponse(413, { ok: false, error: 'Заявка слишком большая.' }, origin);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return jsonResponse(413, { ok: false, error: 'Заявка слишком большая.' }, origin);
  }

  let body;
  try {
    body = JSON.parse(rawBody || '{}');
  } catch {
    return jsonResponse(400, { ok: false, error: 'Некорректные данные заявки.' }, origin);
  }

  if (cleanString(body.website, 200)) {
    return jsonResponse(202, { ok: true }, origin);
  }

  const { lead, error } = validateLead(body);
  if (error) return jsonResponse(422, { ok: false, error }, origin);

  const token = cleanString(env?.TELEGRAM_BOT_TOKEN, 256);
  const chatId = cleanString(env?.TELEGRAM_CHAT_ID, 128);
  if (!token || !chatId) {
    return jsonResponse(500, { ok: false, error: 'Отправка заявок временно недоступна.' }, origin);
  }

  try {
    const telegramResponse = await fetchImpl(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: formatTelegramLead(lead),
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(8_000),
      }
    );
    if (!telegramResponse.ok) throw new Error('Telegram rejected the request');
  } catch {
    return jsonResponse(502, { ok: false, error: 'Не удалось отправить заявку.' }, origin);
  }

  return jsonResponse(201, { ok: true }, origin);
}

export async function onRequestOptions({ request }) {
  return handleOptions(request);
}

export async function onRequestPost({ request, env }) {
  return handleLeadRequest(request, env, globalThis.fetch);
}

export { cleanString, formatTelegramLead, normalizePhone };
