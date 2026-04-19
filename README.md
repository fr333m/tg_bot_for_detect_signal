# Bybit Price Tracking Telegram Bot

Telegram бот для отслеживания цен криптовалюты на бирже Bybit через WebSocket. Построен на Node.js с использованием ES6 модулей.

## Возможности

- 📱 Отслеживание цен в реальном времени через Bybit WebSocket
- 🔔 Уведомления об изменении цен в Telegram
- 📊 Истории цен в SQLite БД
- 👥 Управление подписками пользователей
- ⚙️ Настраиваемые символы и пороги оповещений
- 🔄 Автоматическое переподключение при разрыве соединения

## Структура проекта

```
live_parsing_price/
├── src/
│   ├── config/
│   │   └── settings.js          # Конфигурация приложения
│   ├── bot/
│   │   └── bot.js               # Telegram бот
│   ├── websocket/
│   │   ├── client.js            # WebSocket клиент Bybit
│   │   └── listeners.js         # Обработчики событий цен
│   ├── database/
│   │   └── db.js                # SQLite операции
│   └── utils/
│       ├── logger.js            # Логирование
│       └── constants.js         # Константы
├── logs/                        # Логи приложения
├── index.js                     # Точка входа
├── package.json                 # Зависимости Node.js
├── .env.example                 # Пример переменных окружения
├── .gitignore                   # Git ignore
└── README.md                    # Этот файл
```

## Установка

### 1. Требования

- Node.js 14+ и npm
- Telegram Bot Token
- Интернет соединение

### 2. Клонирование репозитория

```bash
git clone <repository_url>
cd live_parsing_price
```

### 3. Установка зависимостей

```bash
npm install
```

### 4. Настройка переменных окружения

```bash
# Скопируйте .env.example в .env
cp .env.example .env

# Отредактируйте .env и добавьте:
# TELEGRAM_TOKEN=YOUR_BOT_TOKEN
# TELEGRAM_CHAT_ID=YOUR_CHAT_ID
# SYMBOLS_TO_TRACK=BTCUSDT,ETHUSDT,ADAUSDT
```

## Использование

### Запуск бота

```bash
# Production
npm start

# Development (с автоперезагрузкой через nodemon)
npm run dev
```

### Команды бота

- `/start` - Начать работу с ботом
- `/subscribe` - Подписаться на уведомления
- `/unsubscribe` - Отписаться от уведомлений
- `/status` - Проверить статус бота

## Получение Telegram Token

1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям и скопируйте токен в `.env`

## Получение Chat ID

```bash
# Напишите сообщение боту, затем:
curl https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

Найдите поле `"id"` в ответе - это ваш Chat ID.

## Конфигурация

Отредактируйте `src/config/settings.js` для изменения:

- `symbolsToTrack` - Список криптовалют для отслеживания
- `priceChangeThreshold` - Процент изменения цены для оповещения (%)
- `checkInterval` - Интервал проверки цены (мс)

## WebSocket Bybit

Бот при запуске автоматически подключается:

- **URL**: `wss://stream.bybit.com/v5/public/spot`
- **Подписки**: tickers.spot.{SYMBOL} (например, tickers.spot.BTCUSDT)
- **Переподключение**: Автоматическое с экспоненциальной задержкой

## База данных

SQLite БД хранит:

- **prices** - История цен криптовалют
- **users** - Пользователи Telegram
- **subscriptions** - Подписки пользователей
- **alerts** - История оповещений о смене цен

База создается автоматически в `price_tracker.db`.

## Логирование

Логи сохраняются в `logs/bot.log`:

- Формат: `[timestamp] [LEVEL] [module] message`
- Уровни: DEBUG, INFO, WARN, ERROR
- Логирование в консоль и файл одновременно

## Структура кода

### Точка входа: `index.js`

Инициализирует приложение и управляет жизненным циклом:

```javascript
- Настройка БД
- Запуск Telegram бота
- Подключение к WebSocket
- Подписка на символы
- Обработка сигналов завершения
```

### WebSocket Client: `src/websocket/client.js`

Асинхронный клиент для работы с Bybit:

```javascript
- connect() - Подключение к WebSocket
- subscribe(symbol, callback) - Подписка на цены
- unsubscribe(symbol) - Отписка от цен
- reconnect() - Переподключение при разрыве
```

### Price Listener: `src/websocket/listeners.js`

Обработка изменений цен:

```javascript
- Отслеживание предыдущих цен
- Расчет процента изменения
- Выполнение callback при достижении порога
```

### Telegram Bot: `src/bot/bot.js`

Интеграция с Telegram:

```javascript
- Команды: /start, /subscribe, /unsubscribe, /status
- Отправка уведомлений об изменении цен
- Интерактивные клавиатуры
```

### База данных: `src/database/db.js`

Работа с SQLite:

```javascript
- CRUD операции для цен, пользователей, подписок
- Promise-based API для асинхронности
```

## Примеры использования

### Отслеживание новых символов

Отредактируйте `.env`:

```bash
SYMBOLS_TO_TRACK=BTCUSDT,ETHUSDT,ADAUSDT,DOGEUSDT
```

Перезагрузите бот - WebSocket автоматически подпишется.

### Изменение чувствительности оповещений

В `src/config/settings.js`:

```javascript
priceChangeThreshold: 3, // Оповещение при изменении на 3%
```

### Пользовательский обработчик цен

В `index.js`:

```javascript
this.priceListener = new PriceListener(async (priceData) => {
  // Ваша логика обработки
  console.log(`${priceData.symbol}: ${priceData.changePercent}%`);
});
```

## Требования

- **Node.js**: 14.0.0 или выше
- **npm**: 6.0.0 или выше
- **Зависимости**: см. package.json

## Разработка

### Добавление новой команды

В `src/bot/bot.js` добавьте в `setupHandlers()`:

```javascript
this.bot.command('mycommand', this.myCommandHandler.bind(this));
```

Затем определите обработчик:

```javascript
async myCommandHandler(ctx) {
  await ctx.reply('Ответ на команду');
}
```

### Тестирование

```bash
npm test
```

## Лицензия

MIT License

## Поддержка

При возникновении проблем:

1. ✅ Проверьте установку зависимостей: `npm list`
2. ✅ Убедитесь в правильности `.env`
3. ✅ Проверьте интернет соединение
4. ✅ Посмотрите логи: `logs/bot.log`
5. ✅ Убедитесь, что Node.js версия 14+

## Примечания

- Бот асинхронный для одновременной обработки множественных соединений
- WebSocket переподключается автоматически при разрыве
- Все события логируются для отладки
- БД создается автоматически при первом запуске
- Используется современный ES6 синтаксис с модулями
