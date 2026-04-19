// config.js
require('dotenv').config();

class Config {
  constructor() {
    this.BYBIT_API_KEY = process.env.BYBIT_API_KEY || 'wSs1bAEC9dhjGMBDd2';
    this.BYBIT_SECRET_KEY = process.env.BYBIT_SECRET_KEY || 'BbVXm3zvC3vLn68ICEWOTnzA71CS9xTk8x7L';
    this.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8215527549:AAETLhlUUuLW1ppIFDvQJyfIkbdf7LvFCQQ';
    this.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1228844466';
    this.TELEGRAM_API_URL = process.env.TELEGRAM_API_URL || 'https://api.telegram.org/bot';
    this.BASE_URL = process.env.BASE_URL || 'https://api.bybit.com';
    this.DB_PATH = process.env.DB_PATH || 'candles_data.db';
    this.PROXY_URL = process.env.PROXY_URL || 'user163973:tkdbfs@46.38.128.81:8693';
  }
}

module.exports = new Config();