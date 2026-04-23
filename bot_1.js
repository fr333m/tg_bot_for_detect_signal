// const {priceTracker} = require('./websocket/ws');
const SQLiteDB = require('./database/db');
const { createBot } = require('./bot/bot');
const dbService = new SQLiteDB('./prices.db');
const { priceTracker } = require('./websocket/ws');
const { checkSignals } = require('./checkSignals/checkSignals');
const { sendSignal } = require('./bot/send_signal');


async function initializeDatabase() {
    await dbService.printTable('trackingContracts');
    const contracts = await dbService.getLivePricesBySymbol('SOLUSDT');
    console.log(contracts);
    // await dbService.saveTrackingContract([
    //     { symbol: 'ETHUSDT', interval: '5m', price: 2481, from_which_side: 'BUY' }
    //   ]);
    // await dbService.removeDataTable('live_prices');
    // await dbService.removeRowOnSymbol('BTCUSDT', 'trackingContracts');
    // const uniqueSymbols = await dbService.uniqueSymbol('trackingContracts');
    // console.log(uniqueSymbols);
}

// initializeDatabase();

// Вызываем checkSignals каждые 500 миллисекунд


console.log('🚀 Запуск бота...');

const bot = createBot();
let isBotRunning = false;

bot.launch()
    .then(() => {
        isBotRunning = true;
        console.log('✅ Бот успешно запущен!');
        console.log('📌 Используй /start для проверки');
    })
    .catch((err) => {
        console.error('❌ Ошибка при запуске бота:', err);
        console.error('⚠️ Проверьте:');
        console.error('   1. Интернет соединение');
        console.error('   2. Токен Telegram бота (config/config.js)');
        console.error('   3. Доступность Telegram API');
        isBotRunning = false;
    });

// Graceful shutdown
process.once('SIGINT', () => {
    if (isBotRunning) {
        bot.stop('SIGINT');
    } else {
        console.log('⚠️ Бот не был запущен, завершение процесса...');
        process.exit(0);
    }
});
process.once('SIGTERM', () => {
    if (isBotRunning) {
        bot.stop('SIGTERM');
    } else {
        console.log('⚠️ Бот не был запущен, завершение процесса...');
        process.exit(0);
    }
});


// setInterval(() => {
//     checkSignals();
// }, 500);

// ===================== ИСПОЛЬЗОВАНИЕ =====================pr
async function runParser(){
    try {
        await priceTracker.start();
    } catch (err) {
        console.error('💥 Ошибка при запуске парсера:', err);
    }
}

// runParser();




