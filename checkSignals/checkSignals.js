const SqliteDB = require('../database/db');
const dbService = new SqliteDB('./prices.db');
const { sendSignal } = require('../bot/send_signal');


async function checkSignals(params) {
    const { priceTracker } = require('../websocket/ws');
    const symbols = await dbService.getTrackingContracts();

    if (symbols.length === 0) {
        return;
    }
    
    for (const symbol of symbols) {
        const maxPrice = await dbService.getMaxLivePrice(symbol.symbol);
        const minPrice = await dbService.getMinLivePrice(symbol.symbol);
       
        
        if(symbol.from_which_side === "BUY" && minPrice <= symbol.price) {

            await sendSignal(symbol.symbol, symbol.interval);
            await dbService.removeRowOnSymbol(symbol.symbol, 'trackingContracts', symbol.id);
            await priceTracker.reload();
        }
        if(symbol.from_which_side === "SELL" && maxPrice >= symbol.price) {
            
            await sendSignal(symbol.symbol, symbol.interval);
            await dbService.removeRowOnSymbol(symbol.symbol, 'trackingContracts', symbol.id);
            await priceTracker.reload();
            
        }
    }
}

module.exports = {
    checkSignals
}