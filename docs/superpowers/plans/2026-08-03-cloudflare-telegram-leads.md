# Cloudflare Telegram Leads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать так, чтобы все формы опубликованного сайта LS Detailing автоматически отправляли заявки в существующую Telegram-группу через защищённый Cloudflare Worker, без WhatsApp-fallback.

**Architecture:** Статический сайт отправляет JSON на один HTTPS endpoint Cloudflare Worker. Worker проверяет Origin, обязательное согласие и поля, затем вызывает Telegram Bot API с токеном и ID группы из Cloudflare secrets; успех возвращается браузеру только после подтверждённой доставки Telegram.

**Tech Stack:** Vanilla JavaScript, Cloudflare Workers, Node.js built-in test runner, Telegram Bot API, GitHub Pages, Cloudflare Git integration.

## Global Constraints

- Адреса `https://ls-detailing.ru` и `https://www.ls-detailing.ru` и SEO-настройки сайта не меняются.
- WhatsApp остаётся только отдельной ссылкой/иконкой и полностью исключается из отправки форм.
- `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` нельзя добавлять в отслеживаемые Git файлы, HTML или клиентский JavaScript.
- Worker принимает браузерные запросы только с `https://ls-detailing.ru` и `https://www.ls-detailing.ru`.
- Заявка считается отправленной только после успешного ответа Telegram Bot API.
- При ошибке поля формы не очищаются.
- CRM, команды бота, диалоги и отдельное хранилище заявок не добавляются.
- Пользовательские неотслеживаемые файлы в корне и `scripts/build_site_report.py` не изменяются и не добавляются в коммиты.

---

### Task 1: Реализовать и проверить Cloudflare Worker

**Files:**
- Create: `worker/package.json`
- Create: `worker/wrangler.jsonc`
- Create: `worker/src/index.js`
- Create: `worker/test/index.test.js`
- Create: `worker/README.md`

**Interfaces:**
- Consumes: `POST /api/leads` с JSON полями `name`, `phone`, `service`, `request_type`, `comment`, `page_url`, `utm_*`, `privacy_consent`, `website`.
- Produces: Worker default export `{ fetch(request, env): Promise<Response> }`; `201 {"ok":true,"id":"..."}` только после Telegram-доставки; безопасные `4xx/5xx` ответы при ошибках.

- [ ] **Step 1: Написать тесты публичного контракта Worker**

В `worker/test/index.test.js` использовать `node:test`, фиктивный `fetchImpl` и экспорт `createWorker({ fetchImpl })`. Проверить:

```js
const response = await worker.fetch(new Request('https://worker.test/api/leads', {
  method: 'POST',
  headers: {
    Origin: 'https://ls-detailing.ru',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Иван Иванов',
    phone: '+7 (999) 999-99-99',
    service: 'Полировка кузова',
    request_type: 'Запись',
    privacy_consent: 'accepted',
  }),
}), testEnv);
assert.equal(response.status, 201);
assert.equal(telegramCalls.length, 1);
```

Отдельными тестами потребовать: `204` для разрешённого `OPTIONS`; `403` для чужого Origin; `422` без согласия; `422` для короткого телефона; `202` без Telegram-вызова для заполненного honeypot `website`; `502` при неуспешном Telegram; отсутствие токена и ID группы в теле ответа.

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run: `npm test --prefix worker`

Expected: FAIL, потому что `worker/src/index.js` ещё не существует.

- [ ] **Step 3: Реализовать минимальный Worker**

В `worker/src/index.js` разделить ответственность на функции:

```js
const ALLOWED_ORIGINS = new Set([
  'https://ls-detailing.ru',
  'https://www.ls-detailing.ru',
]);

export function createWorker({ fetchImpl = fetch } = {}) {
  return {
    async fetch(request, env) {
      // CORS/method/path → JSON parsing → honeypot → validation
      // → formatTelegramLead → Telegram sendMessage → 201.
    },
  };
}

export default createWorker();
```

Нормализовать российские номера с `8` в `+7`, ограничить имя до 80, услугу до 120, комментарий до 1500 и URL до 500 символов. Telegram вызывать через `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage` с `chat_id: env.TELEGRAM_CHAT_ID`, `disable_web_page_preview: true` и сообщением не длиннее 4096 символов.

- [ ] **Step 4: Добавить воспроизводимую конфигурацию Cloudflare**

`worker/wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "ls-detailing-leads",
  "main": "src/index.js",
  "compatibility_date": "2026-08-03",
  "workers_dev": true,
  "preview_urls": false
}
```

`worker/package.json` содержит scripts `test: node --test` и `deploy: wrangler deploy`, devDependency `wrangler`. В README указать build command `npm install`, deploy command `npx wrangler deploy`, каталоги `worker`, а также имена двух secrets без их значений.

- [ ] **Step 5: Запустить проверки Worker**

Run: `npm test --prefix worker`

Run: `git grep -n 'AAF' -- ':!docs/superpowers'`

Run: `git diff --check`

Expected: тесты проходят; реальный токен не найден; форматирование корректно.

- [ ] **Step 6: Сохранить Worker отдельным коммитом**

```bash
git add worker/package.json worker/wrangler.jsonc worker/src/index.js worker/test/index.test.js worker/README.md
git commit -m "feat: add Cloudflare Telegram lead worker"
```

- [ ] **Step 7: Опубликовать feature branch для подключения Cloudflare**

Run: `git push -u origin codex/telegram-demo`

Expected: GitHub содержит каталог `worker`, а `main` и опубликованный сайт пока не изменены.

### Task 2: Развернуть Worker через GitHub и получить публичный endpoint

**Files:**
- Runtime configuration only: Cloudflare project settings and secrets
- Git history: branch `codex/telegram-demo`, then fast-forward `main`

**Interfaces:**
- Consumes: GitHub repository `gvbaydaeva-lang/detail`, Cloudflare login through GitHub, Worker secrets, current GitHub Pages deployment from `main`.
- Produces: публичный HTTPS URL Worker и успешно настроенная доставка в Telegram без публикации клиентских изменений.

- [ ] **Step 1: Подключить Cloudflare к GitHub**

В Cloudflare Dashboard войти через GitHub, открыть Workers & Pages, импортировать репозиторий `gvbaydaeva-lang/detail`, выбрать каталог `worker`, имя `ls-detailing-leads`, production branch `codex/telegram-demo`, build command `npm install`, deploy command `npx wrangler deploy`.

- [ ] **Step 2: Настроить secrets без записи в проект**

В настройках Worker добавить encrypted secrets `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`. Значения вводятся только в Cloudflare Dashboard. Токен не выводится в терминал, логи или ответ пользователю.

- [ ] **Step 3: Получить точный Worker URL**

Скопировать HTTPS URL, выданный Cloudflare для `ls-detailing-leads`, добавить к нему путь `/api/leads` и сохранить как входное значение для Task 3. Не записывать токен или ID группы рядом с URL.

- [ ] **Step 4: Проверить Worker до переключения сайта**

Run: `npm test --prefix worker`

Отправить разрешённый `OPTIONS` и безопасную тестовую заявку с фиктивного локального payload, но реальными secrets Worker. Expected: CORS разрешает `https://ls-detailing.ru`, запрос получает `201`, и в группе появляется одно тестовое уведомление. Чужой Origin получает `403`.

### Task 3: Переключить формы, опубликовать сайт и проверить результат

**Files:**
- Modify: `scripts/test_form_consent.js`
- Modify: `js/main.js`
- Git history: branch `codex/telegram-demo`, then fast-forward `main`

**Interfaces:**
- Consumes: точный HTTPS URL из Task 2.
- Produces: `resolveLeadEndpoint()` возвращает Worker URL на обоих публичных доменах; обновлённый GitHub Pages сайт; одно реальное Telegram-уведомление из формы.

- [ ] **Step 1: Расширить клиентский тест новым поведением**

В harness `scripts/test_form_consent.js` добавить управляемые ответы `fetch`, счётчик `form.reset()` и сохранённые значения полей. Проверить:

```js
assert.equal(production.endpointCalls(), 1);
assert.equal(production.endpointUrls[0], publishedWorkerEndpoint);
assert.match(production.status.innerHTML, /Заявка отправлена/);
assert.doesNotMatch(production.status.innerHTML, /WhatsApp|wa\.me/i);
```

Для ответа `502` проверить текст `Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам`, отсутствие WhatsApp/`wa.me`, отсутствие `reset()` и повторное включение кнопки. Для двойной отправки до завершения первого запроса проверить только один `fetch`.

- [ ] **Step 2: Запустить тест и подтвердить падение старой логики**

Run: `node scripts/test_form_consent.js`

Expected: FAIL, потому что публичный endpoint пуст, а ошибка всё ещё предлагает WhatsApp.

- [ ] **Step 3: Реализовать согласованное поведение формы**

В `js/main.js`:

- записать точный URL Worker из Task 2 в единственную константу;
- возвращать его из `resolveLeadEndpoint()` для `ls-detailing.ru` и `www.ls-detailing.ru`;
- добавить в payload `privacy_consent: checkbox.checked ? 'accepted' : ''`;
- удалить ветку `if (!endpoint)` с WhatsApp-fallback;
- в `catch` установить только безопасный текст ошибки без HTML-ссылок;
- удалить неиспользуемую `buildWhatsAppLeadUrl()`;
- защищать обработчик от повторного submit, пока кнопка disabled.

- [ ] **Step 4: Запустить все локальные проверки перед публикацией**

Run: `node scripts/test_form_consent.js`

Run: `python3 -m unittest scripts/test_site_ui.py -v`

Run: `npm test --prefix backend`

Run: `npm test --prefix worker`

Run: `rg -n 'Онлайн-отправка подключается|Отправьте эту заявку в WhatsApp|Не удалось отправить автоматически|buildWhatsAppLeadUrl' js scripts '*.html' services`

Run: `git diff --check`

Expected: все тесты проходят; поиск не находит старую логику формы.

- [ ] **Step 5: Сохранить клиентское переключение отдельным коммитом**

```bash
git add js/main.js scripts/test_form_consent.js
git commit -m "feat: send production forms to Telegram worker"
```

- [ ] **Step 6: Опубликовать Worker и сайт**

Push feature branch, затем fast-forward локальный `main` и push:

```bash
git push -u origin codex/telegram-demo
git switch main
git merge --ff-only codex/telegram-demo
git push origin main
```

После push переключить production branch Cloudflare с `codex/telegram-demo` на `main`. Дождаться успешного Cloudflare deploy и обновления GitHub Pages. Не считать push завершением задачи без проверки публичных адресов.

- [ ] **Step 7: Проверить публичные ответы без кеша**

Проверить CORS preflight Worker от `https://ls-detailing.ru`, запрещённый Origin и наличие нового `js/main.js` на обоих адресах сайта. Убедиться, что опубликованный JS не содержит старых WhatsApp-сообщений и содержит точный Worker endpoint.

- [ ] **Step 8: Отправить настоящую заявку с опубликованного сайта**

Открыть `https://ls-detailing.ru`, заполнить одну форму тестовыми данными, установить согласие и отправить один раз. Подтвердить на странице сообщение «Заявка отправлена» и отсутствие перехода/предложения WhatsApp. Пользователь подтверждает появление одного соответствующего уведомления в Telegram-группе.

- [ ] **Step 9: Зафиксировать итоговое состояние**

Run: `git status --short --branch`

Expected: `main` синхронизирован с `origin/main`; секреты и тестовые персональные данные не появились в Git; пользовательские untracked-файлы не затронуты.
