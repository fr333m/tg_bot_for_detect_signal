const { Markup } = require('telegraf');

// Создание клавиатуры с кнопками для выбора контракта
const getContractsKeyboard = (contracts) => {
  const buttons = contracts.map((contract) =>
    Markup.button.callback(
      contract.symbol,
      `symbol_${contract.symbol}`
    )
  );

  // Разделяем кнопки по 2 в ряду
  const keyboard = [];
  for (let i = 0; i < buttons.length; i += 2) {
    keyboard.push(buttons.slice(i, i + 2));
  }

  return Markup.inlineKeyboard(keyboard);
};

// Создание клавиатуры с интервалами
const getIntervalsKeyboard = () => {
  const intervals = ['1', '5', '15', '30', '1h', '4h'];
  
  const buttons = intervals.map((interval) =>
    Markup.button.callback(
      interval,
      `interval_${interval}`
    )
  );

  // Разделяем кнопки по 3 в ряду
  const keyboard = [];
  for (let i = 0; i < buttons.length; i += 3) {
    keyboard.push(buttons.slice(i, i + 3));
  }

  return Markup.inlineKeyboard(keyboard);
};

// Создание клавиатуры с ценами из пиков
const getPricesKeyboard = (peaks, minimas = []) => {
  const buttons = [];
  
  // Если есть пики цен, добавляем их как кнопки
  if (peaks && peaks.length > 0) {
    peaks.forEach((peak, index) => {
      // Проверяем, есть ли эта цена в списке минимумов
      const isMinima = minimas.some(minima => parseFloat(minima.closePrice) === parseFloat(peak.closePrice));
      // Если это минимум - зеленый, если максимум - красный
      const emoji = isMinima ? '🟢' : '🔴';
      
      buttons.push(
        Markup.button.callback(
          `${emoji} ${peak.closePrice} (${peak.dateTime})`,
          `price_${peak.closePrice}_${index}`
        )
      );
    });
  }
  if (minimas && minimas.length > 0) {
    minimas.forEach((minima, index) => {
      // Проверяем, есть ли эта цена в списке пиков
      const isPeak = peaks.some(peak => parseFloat(peak.closePrice) === parseFloat(minima.closePrice));
      // Если это максимум - красный, если минимум - зеленый
      const emoji = isPeak ? '🔴' : '🟢';

      
      buttons.push(
        Markup.button.callback(
          `${emoji} ${minima.closePrice} (${minima.dateTime})`,
          `price_${minima.closePrice}_${index}`
        )
      );
    });
  }
  
  // Добавляем кнопку для ручного ввода
  buttons.push(
    Markup.button.callback('✏️ Ввести вручную', 'price_manual')
  );

  // Разделяем кнопки по 1 в ряду (так как текст может быть длинным)
  const keyboard = buttons.map((btn) => [btn]);

  return Markup.inlineKeyboard(keyboard);
};

// Создание клавиатуры для выбора BUY/SELL
const getSideKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🟢 BUY', 'side_BUY'),
      Markup.button.callback('🔴 SELL', 'side_SELL')
    ]
  ]);
};

module.exports = {
  getContractsKeyboard,
  getIntervalsKeyboard,
  getPricesKeyboard,
  getSideKeyboard
};
