# LS Detailing Leads API

Небольшой backend для форм сайта. Сейчас он:

- принимает `POST /api/leads`;
- проверяет имя, телефон, услугу и тип заявки;
- разрешает браузерные запросы только с доверенных доменов;
- ограничивает частоту запросов по хешу IP;
- отсекает honeypot-спам;
- сохраняет заявки построчно в закрытый файл `leads.ndjson`;
- отправляет оператору структурированное уведомление через Telegram Bot API;
- предоставляет `GET /health`.

Telegram-модуль активируется только при наличии обеих переменных окружения:
`TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`. Токен и ID чата не передаются в браузер и не хранятся в коде.
Если Telegram временно недоступен, заявка не теряется: она уже сохранена в резервном хранилище.

## Запуск

```bash
cp .env.example .env
set -a
source .env
set +a
npm start
```

Перед размещением обязательно замените `IP_HASH_SECRET` и расположите
`LEADS_FILE` вне публичной директории сайта.

Для включения Telegram-уведомлений добавьте в файл окружения:

```dotenv
TELEGRAM_BOT_TOKEN=replace-with-bot-token
TELEGRAM_CHAT_ID=replace-with-group-chat-id
```

После публикации API добавьте на страницы сайта:

```html
<meta name="ls-form-endpoint" content="https://api.example.ru/api/leads">
```

Не подключайте этот meta-тег до того, как `/health` и тестовая заявка успешно
отработают на опубликованном backend.
