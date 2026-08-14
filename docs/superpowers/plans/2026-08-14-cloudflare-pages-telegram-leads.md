# Cloudflare Pages Telegram Leads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Опубликовать LS Detailing через Cloudflare Pages и сделать так, чтобы все формы сайта безопасно отправляли заявки существующим Telegram-ботом без базы данных и платного сервера.

**Architecture:** GitHub остаётся источником кода, а Cloudflare Pages публикует только собранный каталог `dist`. Same-origin Pages Function по адресу `/api/leads` валидирует заявку и вызывает Telegram Bot API с `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` из Cloudflare secrets; браузер никогда не получает секреты.

**Tech Stack:** Static HTML/CSS/JavaScript, Cloudflare Pages Functions, Node.js 20 built-in test runner, Telegram Bot API, GitHub, Cloudflare Dashboard.

## Global Constraints

- Основной публичный адрес остаётся `https://ls-detailing.ru`; `www` перенаправляется на него.
- GitHub остаётся хранилищем кода, но GitHub Pages перестаёт быть production-хостингом после успешной миграции.
- База данных, CRM, команды бота и ответы посетителям не добавляются.
- `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` нельзя записывать в Git, HTML, клиентский JavaScript, команды с выводом секретов или сообщения пользователю.
- Заявка считается успешной только после успешного ответа Telegram Bot API.
- При ошибке форма сохраняет поля и не предлагает автоматическую отправку через WhatsApp.
- Существующие отдельные ссылки WhatsApp на сайте сохраняются.
- Пользовательские изменения в `img/reviews`, `.DS_Store`, DOCX и `scripts/build_site_report.py` не изменяются и не добавляются в коммиты.
- DNS домена переключается только после успешной проверки preview-развёртывания.

---

### Task 1: Реализовать Cloudflare Pages Function по тестам

**Files:**
- Create: `functions/api/leads.js`
- Create: `test/cloudflare-leads.test.mjs`
- Create: `package.json`

**Interfaces:**
- Consumes: `POST /api/leads` с JSON-полями `name`, `phone`, `service`, `request_type`, `comment`, `page_url`, `utm_*`, `privacy_consent`, `website`.
- Produces: `onRequestPost(context): Promise<Response>` и `onRequestOptions(context): Promise<Response>`; ответ `201 {"ok":true}` только после Telegram-доставки.

- [ ] **Step 1: Написать тесты контракта Function**

Создать `test/cloudflare-leads.test.mjs`. Импортировать `onRequestPost` и `onRequestOptions`, передавать `context = { request, env: { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: '-100123' } }` и подменять `globalThis.fetch`. Проверить:

```js
const request = new Request('https://ls-detailing.ru/api/leads', {
  method: 'POST',
  headers: {
    Origin: 'https://ls-detailing.ru',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Анна',
    phone: '+7 (999) 999-99-99',
    service: 'Полировка кузова',
    request_type: 'Запись',
    privacy_consent: 'accepted',
  }),
});
const response = await onRequestPost({ request, env });
assert.equal(response.status, 201);
assert.equal(telegramCalls.length, 1);
```

Отдельные проверки: `204` для same-origin `OPTIONS`; `403` для чужого `Origin`; `415` для не-JSON; `400` для повреждённого JSON; `422` без согласия; `422` для имени короче двух символов; `422` для некорректного телефона; `202` без Telegram-вызова для заполненного `website`; `500` при отсутствующих secrets; `502` при ошибке Telegram; отсутствие токена, chat ID и текста внутренней ошибки во всех ответах.

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run: `node --test test/cloudflare-leads.test.mjs`

Expected: FAIL с `ERR_MODULE_NOT_FOUND`, потому что `functions/api/leads.js` ещё не существует.

- [ ] **Step 3: Реализовать минимальную Function**

В `functions/api/leads.js` экспортировать обработчики и небольшие чистые функции:

```js
export async function onRequestOptions({ request }) {
  return handleOptions(request);
}

export async function onRequestPost({ request, env }) {
  return handleLeadRequest(request, env, globalThis.fetch);
}

export { cleanString, formatTelegramLead, normalizePhone };
```

Требования реализации:

- `Origin` обязан совпадать с `new URL(request.url).origin`; это разрешает production и собственный preview, но запрещает чужие сайты;
- принимать только `application/json` и тело не больше 32 KiB по `Content-Length` и фактической строке;
- ограничить имя до 80, услугу до 120, тип до 40, комментарий до 1500 и URL до 500 символов;
- российский номер из 11 цифр с первой `8` преобразовать в `+7`;
- требовать `privacy_consent === 'accepted'`;
- заполненный `website` возвращает `202 {"ok":true}` без Telegram;
- отправлять `POST https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage` с `chat_id`, `text` и `disable_web_page_preview: true`;
- обрезать сообщение до 4096 символов;
- возвращать только безопасные JSON-ошибки и заголовки `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`.

- [ ] **Step 4: Добавить корневые команды проекта**

Создать `package.json`:

```json
{
  "name": "ls-detailing-site",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "test": "node --test test/*.test.mjs && node scripts/test_form_consent.js",
    "build": "node scripts/build-cloudflare-pages.mjs"
  }
}
```

- [ ] **Step 5: Запустить тесты Function**

Run: `node --test test/cloudflare-leads.test.mjs`

Expected: все тесты проходят; фиктивный Telegram вызван ровно один раз только для валидной заявки.

- [ ] **Step 6: Сохранить Function отдельным коммитом**

```bash
git add package.json functions/api/leads.js test/cloudflare-leads.test.mjs
git commit -m "feat: add Cloudflare Pages lead function"
```

### Task 2: Подключить формы к same-origin API

**Files:**
- Modify: `scripts/test_form_consent.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: relative endpoint `/api/leads` from Task 1.
- Produces: одна попытка `POST /api/leads`; успех очищает форму, ошибка сохраняет поля.

- [ ] **Step 1: Расширить harness формы**

В `scripts/test_form_consent.js` добавить управляемый `fetchResponse`, задерживаемый Promise, состояние `disabled`, счётчик `form.reset()` и значения полей. Проверить:

```js
assert.deepEqual(production.endpointUrls, ['/api/leads']);
assert.equal(production.endpointCalls(), 1);
assert.match(production.status.innerHTML, /Заявка отправлена/);
assert.doesNotMatch(production.status.innerHTML, /WhatsApp|wa\.me/i);
```

Для ответа `502` проверить одно обращение, отсутствие `reset()`, сохранение значений, повторное включение кнопки и текст `Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.` Для второго submit до завершения первого запроса проверить, что выполнен только один `fetch`.

- [ ] **Step 2: Запустить клиентский тест и подтвердить падение старого поведения**

Run: `node scripts/test_form_consent.js`

Expected: FAIL, потому что production endpoint пуст, ошибка предлагает WhatsApp и защита от одновременной повторной отправки отсутствует.

- [ ] **Step 3: Реализовать минимальную клиентскую логику**

В `js/main.js`:

```js
function resolveLeadEndpoint() {
  return document.querySelector('meta[name="ls-form-endpoint"]')?.content?.trim()
    || window.LS_FORM_ENDPOINT
    || '/api/leads';
}
```

В обработчике submit сразу после `event.preventDefault()` выходить, если кнопка уже `disabled`. Удалить ветку пустого endpoint, `buildWhatsAppLeadUrl()` и повторный запрос. Отправлять один `fetch`; при ошибке вызывать:

```js
setFormStatus(
  status,
  'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.',
  'error'
);
```

Текст статуса остаётся статической строкой, поэтому `setFormStatus` можно сохранить без перехода на `textContent`.

- [ ] **Step 4: Запустить клиентские и UI-тесты**

Run: `node scripts/test_form_consent.js`

Run: `python3 -m unittest scripts/test_site_ui.py -v`

Expected: оба набора проходят; поиск `rg -n 'Онлайн-отправка подключается|Отправьте эту заявку в WhatsApp|Не удалось отправить автоматически|buildWhatsAppLeadUrl|sendLeadWithRetry' js scripts` не находит старую логику.

- [ ] **Step 5: Сохранить формы отдельным коммитом**

```bash
git add js/main.js scripts/test_form_consent.js
git commit -m "feat: send website forms to Pages function"
```

### Task 3: Подготовить безопасный каталог публикации Cloudflare Pages

**Files:**
- Create: `scripts/build-cloudflare-pages.mjs`
- Create: `test/cloudflare-build.test.mjs`
- Modify binary: `images/video-tiguan.mp4`
- Create during build, do not track: `dist/`
- Create: `.gitignore` if absent, otherwise modify it

**Interfaces:**
- Consumes: публичные HTML и каталоги `articles`, `services`, `css`, `js`, `img`, `images`; корневые изображения `.jpg`, `.png`, `.webp`; `robots.txt` и `sitemap.xml`.
- Produces: `dist/` без `backend`, `docs`, `functions`, `scripts`, DOCX, DNG, MOV, Git metadata и секретов.

- [ ] **Step 1: Написать тест сборки**

Создать `test/cloudflare-build.test.mjs`, запускать `node scripts/build-cloudflare-pages.mjs`, затем проверять:

```js
assert.equal(existsSync('dist/index.html'), true);
assert.equal(existsSync('dist/js/main.js'), true);
assert.equal(existsSync('dist/services/polirovka-kuzova.html'), true);
assert.equal(existsSync('dist/backend/src/app.js'), false);
assert.equal(existsSync('dist/docs'), false);
assert.equal(existsSync('dist/functions'), false);
assert.equal(existsSync('dist/Отчет_о_соответствии_сайта_LS_Detailing_ТЗ.docx'), false);
```

Рекурсивно проверить каждый файл в `dist`: размер не превышает `25 * 1024 * 1024` байт. Извлечь локальные `src` и `href` из HTML, убрать query/hash и убедиться, что каждый относительный файл существует в `dist`.

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run: `node --test test/cloudflare-build.test.mjs`

Expected: FAIL с отсутствующим `scripts/build-cloudflare-pages.mjs`.

- [ ] **Step 3: Реализовать allowlist-сборку**

В `scripts/build-cloudflare-pages.mjs` сначала безопасно пересоздавать только точный каталог `dist`, затем копировать:

```js
const publicDirectories = ['articles', 'services', 'css', 'js', 'img', 'images'];
const publicRootNames = new Set(['robots.txt', 'sitemap.xml']);
const publicRootExtensions = new Set(['.html', '.jpg', '.jpeg', '.png', '.webp']);
```

Не копировать `CNAME`: домен настраивается в Cloudflare Dashboard. Завершать сборку ошибкой, если любой итоговый файл больше `25 * 1024 * 1024` байт.

- [ ] **Step 4: Сжать единственный используемый файл больше лимита**

Создать временный файл вне проекта и перекодировать видео системной утилитой:

```bash
avconvert --source images/video-tiguan.mp4 --preset PresetAppleM4V720pHD --output /tmp/ls-detailing-video-tiguan.mp4 --replace --disableMetadataFilter
```

Проверить, что файл меньше 25 MiB и воспроизводится, затем заменить `images/video-tiguan.mp4` перекодированным файлом. Исходные крупные корневые `.MOV` не публиковать и не изменять.

- [ ] **Step 5: Добавить `dist/` в `.gitignore` и проверить сборку**

Run: `npm run build`

Run: `node --test test/cloudflare-build.test.mjs`

Run: `find dist -type f -size +25M -print`

Expected: build и тест проходят; последний поиск не выводит файлов; все локальные HTML-зависимости существуют.

- [ ] **Step 6: Сохранить сборку отдельным коммитом**

```bash
git add .gitignore scripts/build-cloudflare-pages.mjs test/cloudflare-build.test.mjs images/video-tiguan.mp4
git commit -m "build: prepare Cloudflare Pages output"
```

### Task 4: Полная локальная проверка и публикация preview

**Files:**
- No source changes expected
- Git history: branch `codex/telegram-demo`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: опубликованная feature branch и preview Cloudflare Pages без изменения production DNS.

- [ ] **Step 1: Запустить все локальные проверки**

Run: `npm test`

Run: `python3 -m unittest scripts/test_site_ui.py -v`

Run: `npm test --prefix backend`

Run: `npm run build`

Run: `git diff --check`

Run: `git grep -nE '[0-9]{8,12}:[A-Za-z0-9_-]{30,}' -- ':!docs/superpowers'`

Expected: тесты и сборка проходят; форматирование корректно; шаблон реального Telegram-токена не найден.

- [ ] **Step 2: Проверить границы коммитов**

Run: `git status --short --branch`

Expected: пользовательские удаления `img/reviews/review-*.png`, `.DS_Store`, DOCX и `scripts/build_site_report.py` остаются незакоммиченными; код задачи закоммичен.

- [ ] **Step 3: Опубликовать feature branch**

Run: `git push -u origin codex/telegram-demo`

Expected: GitHub содержит Function, тесты и сборочный скрипт; `main` и текущий production-сайт ещё не изменены.

- [ ] **Step 4: Подключить Cloudflare Pages к GitHub**

В Cloudflare Dashboard создать Pages project из `gvbaydaeva-lang/detail` со значениями:

- production branch: `codex/telegram-demo` на этапе preview;
- build command: `npm run build`;
- build output directory: `dist`;
- root directory: `/`;
- Node version: `20`.

Дождаться статуса успешного deploy и записать выданный адрес `*.pages.dev` без секретов в рабочие заметки текущего сеанса.

- [ ] **Step 5: Проверить preview без Telegram secrets**

Открыть главную страницу, страницу услуги, статью, изображения и оба видео. Отправка формы должна получить безопасную ошибку, сохранить введённые поля и не открыть WhatsApp; это подтверждает, что секреты ещё не раскрыты и Function активна.

### Task 5: Настроить Telegram secrets и проверить доставку

**Files:**
- Cloudflare encrypted variables only
- No tracked files

**Interfaces:**
- Consumes: существующий Telegram bot token и ID целевого личного чата или закрытой группы.
- Produces: preview-форма доставляет одно уведомление Telegram.

- [ ] **Step 1: Подтвердить безопасный доступ к боту**

Проверить наличие актуального токена у владельца через BotFather. Если прежний токен когда-либо отправлялся в переписку или сохранялся в файле, выполнить BotFather `/revoke` и использовать новый токен. Сам токен не копировать в чат Codex и не записывать в репозиторий.

- [ ] **Step 2: Подготовить целевой Telegram-чат**

В личном чате нажать `Start` или добавить бота в закрытую группу и отправить одно служебное сообщение. Получить числовой chat ID через защищённый вызов `getUpdates`, не выводя токен и содержимое других сообщений в логи.

- [ ] **Step 3: Добавить secrets в Cloudflare**

В Settings → Variables and Secrets добавить как encrypted secrets:

- `TELEGRAM_BOT_TOKEN`;
- `TELEGRAM_CHAT_ID`.

Перезапустить production deployment ветки `codex/telegram-demo`, чтобы secrets стали доступны Function.

- [ ] **Step 4: Проверить API и форму preview**

Проверить same-origin `OPTIONS`, запрещённый чужой Origin и одну реальную заявку из формы. Expected: форма показывает `Заявка отправлена`, поля очищаются, в Telegram появляется ровно одно сообщение с теми же именем, телефоном и услугой.

### Task 6: Переключить production и домен без простоя

**Files:**
- Git history: fast-forward `main`
- Cloudflare Pages production settings and DNS

**Interfaces:**
- Consumes: проверенный preview из Task 5.
- Produces: `https://ls-detailing.ru` обслуживается Cloudflare Pages и принимает заявки в Telegram.

- [ ] **Step 1: Опубликовать проверенный код в `main`**

```bash
git switch main
git merge --ff-only codex/telegram-demo
git push origin main
```

Переключить production branch Cloudflare Pages на `main` и дождаться успешной сборки того же commit SHA.

- [ ] **Step 2: Добавить custom domains до изменения внешнего DNS**

В Cloudflare Pages → Custom domains добавить `ls-detailing.ru` и `www.ls-detailing.ru`. Основным оставить apex `ls-detailing.ru`; для `www` настроить постоянный редирект с сохранением пути и query string.

- [ ] **Step 3: Переключить DNS только после готовности Cloudflare**

Заменить текущие GitHub Pages DNS-записи на записи, предложенные Cloudflare Pages. Не удалять доменную зону и не менять регистратора домена. Дождаться статуса Active и выпуска HTTPS-сертификата.

- [ ] **Step 4: Отключить старую GitHub Pages publication**

Только после успешного ответа обоих Cloudflare-доменов отключить GitHub Pages в настройках репозитория, сохранив GitHub repository и Git-интеграцию Cloudflare.

- [ ] **Step 5: Выполнить проверку production без кеша**

Проверить:

- `https://ls-detailing.ru/` возвращает `200`;
- `https://www.ls-detailing.ru/<path>?<query>` перенаправляет на соответствующий apex URL;
- все URL из `sitemap.xml` возвращают `200`;
- опубликованный `js/main.js` содержит `/api/leads` и не содержит Telegram token или WhatsApp fallback формы;
- одна настоящая форма создаёт ровно одно Telegram-уведомление;
- при ошибке Telegram форма сохраняет данные;
- заголовки и DNS показывают Cloudflare, а не GitHub Pages.

- [ ] **Step 6: Зафиксировать итоговое состояние**

Run: `git status --short --branch`

Expected: `main` синхронизирован с `origin/main`; secrets и тестовые персональные данные отсутствуют в Git; пользовательские незакоммиченные файлы не затронуты.
