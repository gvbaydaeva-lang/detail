# Telegram Lead Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Отправить тестовую заявку «Иван Иванов» из локальной формы сайта в закрытую Telegram-группу LS Detailing и сохранить резервную копию заявки.

**Architecture:** Клиентский модуль формы выбирает локальный API только для `localhost` и `127.0.0.1`; публичный сайт без явной настройки сохраняет текущий WhatsApp-fallback. Node.js API валидирует и сохраняет заявку в NDJSON, затем отправляет структурированное уведомление через Telegram Bot API с реквизитами только из переменных окружения.

**Tech Stack:** HTML/JavaScript, Node.js 20+, встроенный `node:http`, Telegram Bot API, NDJSON, Node smoke tests.

## Global Constraints

- Бот только отправляет уведомления; меню, команды и ответы клиентам не добавляются.
- Демонстрация работает локально, пока запущен компьютер.
- `TELEGRAM_BOT_TOKEN` и реальный `TELEGRAM_CHAT_ID` нельзя записывать в отслеживаемые Git файлы.
- Публичный сайт нельзя переключать на локальный или временный API.
- Заявка сохраняется до попытки Telegram-доставки; ошибка Telegram не удаляет её.
- Тестовая заявка: имя `Иван Иванов`, телефон `+7 (999) 999-99-99`, услуга `Полировка кузова`, тип `Запись`.

---

### Task 1: Зафиксировать Telegram-доставку и безопасную конфигурацию

**Files:**
- Modify: `backend/test/smoke.js`
- Modify: `backend/src/app.js`
- Modify: `backend/.env.example`
- Modify: `backend/README.md`
- Verify: `.gitignore`

**Interfaces:**
- Consumes: `createLeadApp({ leadsFile, env, fetchImpl })` из `backend/src/app.js`.
- Produces: `formatTelegramLead(lead): string`; POST `/api/leads`, который сохраняет заявку и вызывает Telegram `sendMessage` при наличии двух переменных окружения.

- [ ] **Step 1: Дополнить smoke-тест ожидаемым Telegram-поведением**

Проверить в `backend/test/smoke.js`:

```js
assert.equal(telegramRequests.length, 1);
assert.equal(telegramBody.chat_id, '-1001234567890');
assert.match(telegramBody.text, /Иван Иванов|Анна/);
assert.match(telegramBody.text, /Телефон:/);
assert.match(telegramBody.text, /Услуга:/);
```

После невалидной заявки проверить, что число Telegram-запросов не увеличилось. Отдельным экземпляром `createLeadApp` с `fetchImpl`, который бросает ошибку, проверить ответ `201` и наличие строки в резервном файле.
Также прочитать `backend/.env.example` и потребовать наличие строк `TELEGRAM_BOT_TOKEN=` и `TELEGRAM_CHAT_ID=`.

- [ ] **Step 2: Запустить тест и зафиксировать причину падения**

Run: `npm test --prefix backend`

Expected: FAIL на проверке `backend/.env.example`, потому что Telegram-переменные в шаблоне пока отсутствуют. Сценарий ошибки доставки при этом подтверждает, что уже подготовленная серверная логика сохраняет заявку.

- [ ] **Step 3: Довести реализацию до минимально достаточного поведения**

В `backend/src/app.js` сохранить порядок:

```js
await appendLead(storedLead);
try {
  await sendTelegramLead(storedLead, env, fetchImpl);
} catch (error) {
  console.error('Telegram lead notification failed:', error.message);
}
return sendJson(response, 201, { ok: true, id: storedLead.id }, allowedOrigin);
```

В `backend/.env.example` добавить только безопасные шаблоны:

```dotenv
TELEGRAM_BOT_TOKEN=replace-with-bot-token
TELEGRAM_CHAT_ID=replace-with-group-chat-id
```

Убедиться, что `.gitignore` содержит `backend/.env` и `backend/data/*.ndjson`. В README описать локальный запуск без реальных значений.

- [ ] **Step 4: Запустить backend-проверки**

Run: `npm test --prefix backend`

Expected: `Backend smoke test passed: health, storage, Telegram, validation and CORS.`

- [ ] **Step 5: Проверить отсутствие секретов и форматирование**

Run: `git diff --check`

Run: `git grep -nE 'TELEGRAM_BOT_TOKEN=[0-9]+:'`

Expected: первая команда завершается успешно; вторая не находит реальный токен.

- [ ] **Step 6: Сохранить реализацию отдельным коммитом**

```bash
git add backend/src/app.js backend/test/smoke.js backend/.env.example backend/README.md .gitignore
git commit -m "feat: deliver website leads to Telegram"
```

### Task 2: Подключить локальную форму к локальному API без влияния на публичный сайт

**Files:**
- Modify: `scripts/test_form_consent.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: meta `ls-form-endpoint`, `window.LS_FORM_ENDPOINT`, `window.location.hostname`.
- Produces: `resolveLeadEndpoint(): string`, который соблюдает приоритет явной конфигурации и использует `http://127.0.0.1:8787/api/leads` только на локальном хосте.

- [ ] **Step 1: Написать тесты выбора endpoint**

Расширить harness в `scripts/test_form_consent.js` параметрами `hostname`, `metaEndpoint`, `windowEndpoint`. Проверить:

```js
assert.equal(local.endpoint(), 'http://127.0.0.1:8787/api/leads');
assert.equal(production.endpoint(), '');
assert.equal(explicit.endpoint(), 'https://api.example.test/api/leads');
```

Сохранить существующие проверки обязательного согласия и единственного вызова API.

- [ ] **Step 2: Запустить тест и увидеть падение локального сценария**

Run: `node scripts/test_form_consent.js`

Expected: FAIL, потому что без явного endpoint локальная форма пока использует WhatsApp-fallback.

- [ ] **Step 3: Реализовать локальный fallback**

Добавить в `js/main.js`:

```js
function resolveLeadEndpoint() {
  const configured =
    document.querySelector('meta[name="ls-form-endpoint"]')?.content?.trim() ||
    window.LS_FORM_ENDPOINT ||
    '';
  if (configured) return configured;
  return ['127.0.0.1', 'localhost'].includes(window.location.hostname)
    ? 'http://127.0.0.1:8787/api/leads'
    : '';
}
```

Заменить текущую inline-настройку на `const endpoint = resolveLeadEndpoint();`.

- [ ] **Step 4: Запустить клиентские и общие проверки**

Run: `node scripts/test_form_consent.js`

Run: `python3 -m unittest scripts/test_site_ui.py -v`

Expected: обе команды завершаются успешно.

- [ ] **Step 5: Сохранить локальное подключение отдельным коммитом**

```bash
git add js/main.js scripts/test_form_consent.js
git commit -m "feat: connect local forms to lead API"
```

### Task 3: Выполнить настоящую тестовую отправку

**Files:**
- Runtime-only: переменные окружения процесса backend
- Runtime output: `backend/data/leads.ndjson` (игнорируется Git)

**Interfaces:**
- Consumes: локальная форма `http://127.0.0.1:8000/`, API `http://127.0.0.1:8787/api/leads`.
- Produces: одно Telegram-сообщение в закрытой группе и одну NDJSON-запись.

- [ ] **Step 1: Запустить финальные автоматические проверки**

Run: `npm test --prefix backend`

Run: `node scripts/test_form_consent.js`

Run: `python3 -m unittest scripts/test_site_ui.py -v`

Expected: все проверки проходят до использования реального токена.

- [ ] **Step 2: Запустить API с секретами только в окружении процесса**

Запустить `backend/src/server.js` с `ALLOWED_ORIGINS=http://127.0.0.1:8000`, реальными `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`, не создавая отслеживаемого файла и не печатая токен в отчёте.

- [ ] **Step 3: Запустить локальную копию сайта**

Run: `python3 -m http.server 8000 --bind 127.0.0.1`

Expected: `http://127.0.0.1:8000/` открывается, а форма указывает на локальный API через `resolveLeadEndpoint()`.

- [ ] **Step 4: Отправить форму через браузер**

Ввести:

```text
Имя: Иван Иванов
Телефон: +7 (999) 999-99-99
Тип обращения: Запись
Услуга: Полировка кузова
Комментарий: Тестовая заявка для демонстрации Telegram-бота
Согласие: включено
```

Нажать кнопку отправки один раз и дождаться успешного status-сообщения.

- [ ] **Step 5: Проверить два результата**

Проверить последнюю строку `backend/data/leads.ndjson`: имя, нормализованный телефон `+79999999999`, услугу и уникальный ID. Пользователь подтверждает появление соответствующего сообщения в группе Telegram.

- [ ] **Step 6: Остановить временные процессы и проверить Git**

Остановить локальные серверы. Run: `git status --short`.

Expected: реальный токен и `leads.ndjson` отсутствуют среди отслеживаемых изменений; остаются только намеренные коммиты и ранее существовавшие пользовательские файлы.
