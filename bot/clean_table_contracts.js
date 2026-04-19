const SQLiteDB = require('../database/db');
const dbService = new SQLiteDB('./prices.db');
const { priceTracker } = require('../websocket/ws');

const cleanTableContracts = async (ctx) => {
    try {
        await ctx.reply('⛔ Остановка скрипта...');

        // Динамический импорт для избежания циклической зависимости
        await dbService.removeDataTable('trackingContracts');
        await priceTracker.reload();
        await ctx.reply(`✅ Таблица trackingContracts успешно очищена!`);

    } catch (error) {
        console.error('Ошибка в cleanTableContracts:', error);
        await ctx.reply('❌ Произошла ошибка при остановке скрипта.');
    }
};

module.exports = {
    cleanTableContracts
} 