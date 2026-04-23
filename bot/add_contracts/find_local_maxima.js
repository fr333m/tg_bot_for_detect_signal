const { formatShort } = require('./transform_timestamp');

async function findMaxima(candles) {
    // Step 1: Разделяем массив свечей на 7 равных частей
    const partSize = Math.ceil(candles.length / 7);
    const parts = [];
    
    for (let p = 0; p < 7; p++) {
        const start = p * partSize;
        const end = Math.min(start + partSize, candles.length);
        parts.push(candles.slice(start, end));
    }
    
    // Step 2: Для каждой части находим максимум
    const results = [];
    const currentPrice = candles[1][4]; // Текущая цена
    console.log('Текущая цена:', currentPrice);
    const windowSize = 10; // ±10 свечей для поиска локального максимума
    
    for (let partIndex = 0; partIndex < parts.length; partIndex++) {
        const part = parts[partIndex];
        const localMaxima = [];
        
        // Находим все локальные максимумы в текущей части
        for (let i = 0; i < part.length; i++) {
            const currentClose = part[i][4];
            let isMax = true;
            
            // Проверяем левую сторону
            for (let j = Math.max(0, i - windowSize); j < i; j++) {
                if (part[j][4] >= currentClose) {
                    isMax = false;
                    break;
                }
            }
            
            if (!isMax) continue;
            
            // Проверяем правую сторону
            for (let j = i + 1; j <= Math.min(part.length - 1, i + windowSize); j++) {
                if (part[j][4] >= currentClose) {
                    isMax = false;
                    break;
                }
            }
            
            if (isMax) {
                localMaxima.push(part[i]);
            }
        }
        
        // Step 3: Фильтруем максимумы где close >= currentPrice
        const filteredMaxima = localMaxima.filter(candle => candle[4] >= currentPrice);
        console.log(filteredMaxima);
        // Step 4: Находим самый высокий максимум в этой части
        if (filteredMaxima.length > 0) {
            results.push({
                closePrice: filteredMaxima[0][4],
                dateTime: formatShort(filteredMaxima[0][0])
            });
        }
    }
    
    return results;
}

module.exports = {
    findMaxima
}