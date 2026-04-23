const BybitClient = require('../../api/bybit_api');
const config = require('../../config/config');
const {findMaxima} = require('./find_local_maxima');
const {formatTimestamp} = require('./transform_timestamp');


const bybitClient = new BybitClient(config.BYBIT_API_KEY, config.BYBIT_SECRET_KEY);

async function getPeaksPriceContracts(symbol, interval) {
    const limit = 210;
    const ohlcData = await bybitClient.getCandles(symbol, interval, limit);

    if (ohlcData.length === 0) {
        return [];
    }

const peaks = await findMaxima(ohlcData);
    
console.log(symbol, interval, peaks);

return peaks;

}

module.exports = {
    getPeaksPriceContracts
}