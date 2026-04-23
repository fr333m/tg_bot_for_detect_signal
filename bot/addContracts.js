const SqliteDB = require('../database/db');
const { priceTracker } = require('../websocket/ws');
const {getTopVolumeContracts} = require('./add_contracts/get_top_volume_contracts');
const {getPeaksPriceContracts} = require('./add_contracts/get_peaks_price_contract');
const {getMinimaPeaksPriceContracts} = require('./add_contracts/get_minima_peaks_contracts');
const { getContractsKeyboard, getIntervalsKeyboard, getPricesKeyboard, getSideKeyboard } = require('./keyboards');

const dbService = new SqliteDB();
const userStates = new Map();

const SYMBOL_REGEX = /^[A-Z0-9]{2,}USDT$/;
const INTERVAL_REGEX = /^(\d+|1|5|15|30)(m|h|d|w)?$/i;
const SIDE_MAP = {
  BAY: 'BUY',
  BUY: 'BUY',
  SELL: 'SELL'
};

// Преобразование интервала в формат Bybit (добавляем 'm' если нужно)
const normalizeInterval = (interval) => {
  interval = interval.toLowerCase();
  if (interval === '1' || interval === '5' || interval === '15' || interval === '30') {
    return `${interval}`;
  }
  return interval;
};

const getUserId = (ctx) => ctx.from?.id;
const getMessageText = (ctx) => ctx.message?.text?.trim() || '';

const resetUserState = (userId) => {
  userStates.delete(userId);
};

const askSymbol = async (ctx) => {
  try {
    const contracts = await getTopVolumeContracts();
    await ctx.reply(
      'Добавление контракта\n\n' +
        '1/4 Выберите фьючерсный контракт:',
      getContractsKeyboard(contracts)
    );
  } catch (error) {
    console.error('Ошибка при получении контрактов:', error);
    await ctx.reply('Не удалось получить список контрактов. Попробуйте снова через /add.');
  }
};

const askInterval = async (ctx, symbol) => {
  await ctx.reply(
    `Контракт: ${symbol}\n\n` +
      '2/4 Укажите таймфрейм:',
    getIntervalsKeyboard()
  );
};

const askPrice = async (ctx, userId) => {
  try {
    const state = userStates.get(userId);
    if (!state) {
      await ctx.reply('Сессия истекла. Начните снова с /add.');
      return;
    }

    const symbol = state.data.symbol;
    const interval = state.data.interval;
    
    const peaks = await getPeaksPriceContracts(symbol, interval);
    const minimas = await getMinimaPeaksPriceContracts(symbol, interval);
    console.log('Пики:', peaks);
    console.log('Минимумы:', minimas);
    
    await ctx.reply(
      `Контракт: ${symbol}\n` +
        `Таймфрейм: ${interval}\n\n` +
        '3/4 Выберите цену или введите вручную:\n' +
        '(🟢 - локальные минимумы, 🔴 - локальные максимумы)',
      getPricesKeyboard(peaks, minimas)
    );
  } catch (error) {
    console.error('Ошибка при получении пиков цен:', error);
    const state = userStates.get(userId);
    const interval = state?.data?.interval || '';
    await ctx.reply(
      `Таймфрейм: ${interval}\n\n` +
        '3/4 Не удалось получить цены. Введите цену вручную (пример: 7.82661):'
    );
  }
};

const askSide = async (ctx, price) => {
  await ctx.reply(
    `Цена: ${price}\n\n` +
      '4/4 Выберите сторону:',
    getSideKeyboard()
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

// Обработчик выбора контракта через callback
const handleSymbolCallback = async (ctx) => {
  const userId = getUserId(ctx);
  const data = ctx.callbackQuery.data;
  const symbol = data.replace('symbol_', '');

  if (!userId) {
    await ctx.reply('Не удалось определить пользователя.');
    return;
  }

  const state = userStates.get(userId);
  if (!state) {
    await ctx.reply('Сессия истекла. Начните снова с /add.');
    return;
  }

  state.data.symbol = symbol;
  state.step = 'interval';
  userStates.set(userId, state);

  await ctx.answerCbQuery(); // Закрыть уведомление
  await askInterval(ctx, symbol);
};

// Обработчик выбора интервала через callback
const handleIntervalCallback = async (ctx) => {
  const userId = getUserId(ctx);
  const data = ctx.callbackQuery.data;
  const interval = normalizeInterval(data.replace('interval_', ''));

  if (!userId) {
    await ctx.reply('Не удалось определить пользователя.');
    return;
  }

  const state = userStates.get(userId);
  if (!state) {
    await ctx.reply('Сессия истекла. Начните снова с /add.');
    return;
  }

  state.data.interval = interval;
  state.step = 'price';
  userStates.set(userId, state);

  await ctx.answerCbQuery();
  await askPrice(ctx, userId);
};

// Обработчик выбора цены через callback
const handlePriceCallback = async (ctx) => {
  const userId = getUserId(ctx);
  const data = ctx.callbackQuery.data;

  if (!userId) {
    await ctx.reply('Не удалось определить пользователя.');
    return;
  }

  const state = userStates.get(userId);
  if (!state) {
    await ctx.reply('Сессия истекла. Начните снова с /add.');
    return;
  }

  // Если выбран ручной ввод
  if (data === 'price_manual') {
    state.step = 'price_manual';
    userStates.set(userId, state);
    await ctx.answerCbQuery();
    await ctx.reply('Введите цену вручную (пример: 7.82661):');
    return;
  }

  // Если выбрана цена из списка
  const priceMatch = data.match(/^price_(.+?)_\d+$/);
  if (priceMatch) {
    const price = parseFloat(priceMatch[1]);
    
    if (!Number.isFinite(price) || price <= 0) {
      await ctx.reply('Ошибка при обработке цены. Попробуйте снова.');
      return;
    }

    state.data.price = price;
    state.step = 'side';
    userStates.set(userId, state);

    await ctx.answerCbQuery();
    await askSide(ctx, state.data.price);
  }
};

// Обработчик выбора стороны через callback
const handleSideCallback = async (ctx) => {
  const userId = getUserId(ctx);
  const data = ctx.callbackQuery.data;
  const side = data.replace('side_', '');

  if (!userId) {
    await ctx.reply('Не удалось определить пользователя.');
    return;
  }

  const state = userStates.get(userId);
  if (!state) {
    await ctx.reply('Сессия истекла. Начните снова с /add.');
    return;
  }

  const symbol = state.data.symbol;
  const interval = state.data.interval;
  const price = state.data.price;
  const from_which_side = side;

  try {
    await dbService.saveTrackingContract([
      { symbol, interval, price, from_which_side }
    ]);

    if (priceTracker.ws && priceTracker.ws.readyState === 1) {
      await priceTracker.refreshSubscriptions();
    } else {
      await priceTracker.start();
    }

    await ctx.answerCbQuery();
    await ctx.reply(
      'Контракт успешно сохранен.\n\n' +
        `Символ: ${symbol}\n` +
        `Таймфрейм: ${interval}\n` +
        `Цена: ${price}\n` +
        `Сторона: ${from_which_side}`
    );

    resetUserState(userId);
  } catch (error) {
    console.error('Ошибка при сохранении контракта:', error);
    await ctx.reply('Не удалось сохранить контракт. Попробуйте снова через /add.');
    resetUserState(userId);
  }
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
      const normalizedInterval = normalizeInterval(text);
      const result = validateInterval(normalizedInterval);

      if (!result.isValid) {
        await ctx.reply(result.error);
        await askInterval(ctx, state.data.symbol);
        return;
      }

      state.data.interval = normalizedInterval;
      state.step = 'price';
      userStates.set(userId, state);
      await askPrice(ctx, userId);
      return;
    }

    if (state.step === 'price_manual') {
      const result = validatePrice(text);

      if (!result.isValid) {
        await ctx.reply(result.error);
        await ctx.reply('Введите цену вручную (пример: 7.82661):');
        return;
      }

      state.data.price = result.value;
      state.step = 'side';
      userStates.set(userId, state);
      await askSide(ctx, state.data.price);
      return;
    }

    if (state.step === 'price') {
      const result = validatePrice(text);

      if (!result.isValid) {
        await ctx.reply(result.error);
        await askPrice(ctx, userId);
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
  handleAddContractsMessage,
  handleSymbolCallback,
  handleIntervalCallback,
  handlePriceCallback,
  handleSideCallback
};
