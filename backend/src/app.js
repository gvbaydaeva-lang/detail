import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const MAX_BODY_BYTES = 32 * 1024;
const REQUEST_TYPES = new Set([
  'Консультация',
  'Запись',
  'Обратный звонок',
  'consultation',
  'booking',
  'estimate',
]);

function envNumber(env, key, fallback) {
  const value = Number(env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function cleanString(value, maxLength = 500) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizePhone(value) {
  const raw = cleanString(value, 40);
  const digits = raw.replace(/\D/g, '');
  return {
    display: raw,
    digits: digits.startsWith('8') && digits.length === 11 ? `7${digits.slice(1)}` : digits,
  };
}

function validateLead(body) {
  const name = cleanString(body.name, 80);
  const phone = normalizePhone(body.phone);
  const service = cleanString(body.service, 120);
  const requestType = cleanString(body.request_type, 40) || 'Консультация';
  const errors = {};

  if (name.length < 2) errors.name = 'Укажите имя длиной не менее 2 символов.';
  if (phone.digits.length < 11 || phone.digits.length > 15) {
    errors.phone = 'Укажите корректный номер телефона.';
  }
  if (!service) errors.service = 'Укажите интересующую услугу.';
  if (!REQUEST_TYPES.has(requestType)) errors.request_type = 'Недопустимый тип заявки.';

  return {
    errors,
    lead: {
      name,
      phone: phone.display,
      phone_normalized: `+${phone.digits}`,
      service,
      request_type: requestType,
      comment: cleanString(body.comment, 1500),
      page_url: cleanString(body.page_url, 500),
      page_title: cleanString(body.page_title, 200),
      referrer: cleanString(body.referrer, 500),
      utm_source: cleanString(body.utm_source, 120),
      utm_medium: cleanString(body.utm_medium, 120),
      utm_campaign: cleanString(body.utm_campaign, 160),
      utm_content: cleanString(body.utm_content, 160),
      utm_term: cleanString(body.utm_term, 160),
      submitted_at: cleanString(body.submitted_at, 40),
    },
  };
}

function getClientIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return request.socket.remoteAddress || 'unknown';
}

function hashIp(ip, secret) {
  return createHash('sha256').update(`${secret}:${ip}`).digest('hex').slice(0, 24);
}

function sendJson(response, status, payload, origin) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
  });
  response.end(body);
}

async function readJson(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Payload too large');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    const error = new Error('Invalid JSON');
    error.statusCode = 400;
    throw error;
  }
}

export function createLeadApp(options = {}) {
  const env = options.env || process.env;
  const allowedOrigins = new Set(
    (env.ALLOWED_ORIGINS || 'https://ls-detailing.ru')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const leadsFile = resolve(options.leadsFile || env.LEADS_FILE || './data/leads.ndjson');
  const ipHashSecret = env.IP_HASH_SECRET || 'development-only-secret';
  const rateWindowMs = envNumber(env, 'RATE_LIMIT_WINDOW_MS', 10 * 60 * 1000);
  const rateMax = envNumber(env, 'RATE_LIMIT_MAX', 5);
  const rateBuckets = new Map();

  async function appendLead(lead) {
    await mkdir(dirname(leadsFile), { recursive: true, mode: 0o700 });
    const file = await open(leadsFile, 'a', 0o600);
    try {
      await file.appendFile(`${JSON.stringify(lead)}\n`, 'utf8');
    } finally {
      await file.close();
    }
  }

  function rateLimit(ipHash, now) {
    const current = rateBuckets.get(ipHash);
    if (!current || now - current.startedAt >= rateWindowMs) {
      rateBuckets.set(ipHash, { count: 1, startedAt: now });
      return false;
    }
    current.count += 1;
    return current.count > rateMax;
  }

  return async function leadApp(request, response) {
    const url = new URL(request.url || '/', 'http://localhost');
    const origin = request.headers.origin || '';
    const allowedOrigin = allowedOrigins.has(origin) ? origin : '';

    if (request.method === 'GET' && url.pathname === '/health') {
      return sendJson(response, 200, { ok: true, service: 'ls-detailing-leads' }, allowedOrigin);
    }

    if (url.pathname !== '/api/leads') {
      return sendJson(response, 404, { ok: false, error: 'Not found' }, allowedOrigin);
    }

    if (request.method === 'OPTIONS') {
      if (origin && !allowedOrigin) {
        return sendJson(response, 403, { ok: false, error: 'Origin is not allowed' });
      }
      response.writeHead(204, {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      });
      return response.end();
    }

    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST, OPTIONS');
      return sendJson(response, 405, { ok: false, error: 'Method not allowed' }, allowedOrigin);
    }

    if (origin && !allowedOrigin) {
      return sendJson(response, 403, { ok: false, error: 'Origin is not allowed' });
    }

    if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
      return sendJson(response, 415, { ok: false, error: 'Content-Type must be application/json' }, allowedOrigin);
    }

    const now = Date.now();
    const ipHash = hashIp(getClientIp(request), ipHashSecret);
    if (rateLimit(ipHash, now)) {
      response.setHeader('Retry-After', String(Math.ceil(rateWindowMs / 1000)));
      return sendJson(response, 429, { ok: false, error: 'Слишком много попыток. Попробуйте позже.' }, allowedOrigin);
    }

    try {
      const body = await readJson(request);

      // Honeypot: отвечаем как на успешную заявку, но ничего не сохраняем.
      if (cleanString(body.website, 200)) {
        return sendJson(response, 202, { ok: true }, allowedOrigin);
      }

      const { errors, lead } = validateLead(body);
      if (Object.keys(errors).length) {
        return sendJson(
          response,
          422,
          { ok: false, error: 'Проверьте данные формы.', fields: errors },
          allowedOrigin
        );
      }

      const storedLead = {
        id: randomUUID(),
        received_at: new Date(now).toISOString(),
        source_ip_hash: ipHash,
        ...lead,
      };
      await appendLead(storedLead);

      return sendJson(response, 201, { ok: true, id: storedLead.id }, allowedOrigin);
    } catch (error) {
      const status = error.statusCode || 500;
      if (status >= 500) console.error('Lead API error:', error);
      return sendJson(
        response,
        status,
        { ok: false, error: status >= 500 ? 'Не удалось сохранить заявку.' : error.message },
        allowedOrigin
      );
    }
  };
}

export { validateLead };
