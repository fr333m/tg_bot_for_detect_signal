const SqliteDB = require('../database/db');
const { priceTracker } = require('../websocket/ws');

const dbService = new SqliteDB();
const userStates = new Map();

const SYMBOL_REGEX = /^[A-Z0-9]{2,}USDT$/;
const INTERVAL_REGEX = /^\d+(m|h|d|w)$/i;
const SIDE_MAP = {
  BAY: 'BUY',
  BUY: 'BUY',
  SELL: 'SELL'
};

const getUserId = (ctx) => ctx.from?.id;
const getMessageText = (ctx) => ctx.message?.text?.trim() || '';

const resetUserState = (userId) => {
  userStates.delete(userId);
};

const askSymbol = async (ctx) => {
  await ctx.reply(
    'Добавление контракта\n\n' +
      '1/4 Введите наименование фьючерсного контракта.\n' +
      'Пример: BTCUSDT или ETHUSDT'
  );
};

const askInterval = async (ctx, symbol) => {
  await ctx.reply(
    `Контракт: ${symbol}\n\n` +
      '2/4 Укажите таймфрейм.\n' +
      'Пример: 5m или 1h'
  );
};

const askPrice = async (ctx, interval) => {
  await ctx.reply(
    `Таймфрейм: ${interval}\n\n` +
      '3/4 Укажите цену.\n' +
      'Пример: 7.82661'
  );
};

const askSide = async (ctx, price) => {
  await ctx.reply(
    `Цена: ${price}\n\n` +
      '4/4 Укажите сторону: BUY или SELL'
  );
};

const validateSymbol = (text) => {
  const symbol = text.toUpperCase();

  if (!SYMBOL_REGEX.test(symbol)) {
    return {
      isValid: false,
      error: 'Некорректный контракт. Используйте формат BTCUSDT или ETHUSDT.'
    };
  }

  return {
    isValid: true,
    value: symbol
  };
};

const validateInterval = (text) => {
  const interval = text.toLowerCase();

  if (!INTERVAL_REGEX.test(interval)) {
    return {
      isValid: false,
      error: 'Некорректный таймфрейм. Используйте формат 5m, 15m, 1h, 4h.'
    };
  }

  return {
    isValid: true,
    value: interval
  };
};

const validatePrice = (text) => {
  const normalizedText = text.replace(',', '.');
  const price = Number(normalizedText);

  if (!Number.isFinite(price) || price <= 0) {
    return {
      isValid: false,
      error: 'Некорректная цена. Укажите положительное число, например 7.82661.'
    };
  }

  return {
    isValid: true,
    value: price
  };
};

const validateSide = (text) => {
  const side = SIDE_MAP[text.toUpperCase()];

  if (!side) {
    return {
      isValid: false,
      error: 'Некорректная сторона. Введите BUY или SELL.'
    };
  }

  return {
    isValid: true,
    value: side
  };
};

const addContracts = async (ctx) => {
  const userId = getUserId(ctx);

  if (!userId) {
    await ctx.reply('Не удалось определить пользователя.');
    return;
  }

  userStates.set(userId, {
    step: 'symbol',
    data: {}
  });

  await askSymbol(ctx);
};

const handleAddContractsMessage = async (ctx) => {
  const userId = getUserId(ctx);
  const text = getMessageText(ctx);

  if (!userId || !text || text.startsWith('/')) {
    return;
  }

  const state = userStates.get(userId);

  if (!state) {
    return;
  }

  try {
    if (state.step === 'symbol') {
      const result = validateSymbol(text);

      if (!result.isValid) {
        await ctx.reply(result.error);
        await askSymbol(ctx);
        return;
      }

      state.data.symbol = result.value;
      state.step = 'interval';
      userStates.set(userId, state);
      await askInterval(ctx, state.data.symbol);
      return;
    }

    if (state.step === 'interval') {
      const result = validateInterval(text);

      if (!result.isValid) {
        await ctx.reply(result.error);
        await askInterval(ctx, state.data.symbol);
        return;
      }

      state.data.interval = result.value;
      state.step = 'price';
      userStates.set(userId, state);
      await askPrice(ctx, state.data.interval);
      return;
    }

    if (state.step === 'price') {
      const result = validatePrice(text);

      if (!result.isValid) {
        await ctx.reply(result.error);
        await askPrice(ctx, state.data.interval);
        return;
      }

      state.data.price = result.value;
      state.step = 'side';
      userStates.set(userId, state);
      await askSide(ctx, state.data.price);
      return;
    }

    if (state.step === 'side') {
      const result = validateSide(text);

      if (!result.isValid) {
        await ctx.reply(result.error);
        await askSide(ctx, state.data.price);
        return;
      }

      const symbol = state.data.symbol;
      const interval = state.data.interval;
      const price = state.data.price;
      const from_which_side = result.value;

      await dbService.saveTrackingContract([
        { symbol, interval, price, from_which_side }
      ]);

      if (priceTracker.ws && priceTracker.ws.readyState === 1) {
        await priceTracker.refreshSubscriptions();
      } else {
        await priceTracker.start();
      }

      await ctx.reply(
        'Контракт успешно сохранен.\n\n' +
          `Символ: ${symbol}\n` +
          `Таймфрейм: ${interval}\n` +
          `Цена: ${price}\n` +
          `Сторона: ${from_which_side}`
      );

      resetUserState(userId);
    }
  } catch (error) {
    console.error('Ошибка в addContracts:', error);
    resetUserState(userId);
    await ctx.reply('Не удалось сохранить контракт. Попробуйте снова через /add.');
  }
};

module.exports = {
  addContracts,
  handleAddContractsMessage
};
