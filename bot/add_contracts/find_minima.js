const { formatShort } = require('./transform_timestamp');

async function findMinima(candles) {
    // Step 1: Разделяем массив свечей на 7 равных частей
    const partSize = Math.ceil(candles.length / 7);
    const parts = [];
    
    for (let p = 0; p < 7; p++) {
        const start = p * partSize;
        const end = Math.min(start + partSize, candles.length);
        parts.push(candles.slice(start, end));
    }
    
    // Step 2: Для каждой части находим минимум
    const results = [];
    const currentPrice = candles[1][4]; // Текущая цена
    console.log('Текущая цена:', currentPrice);
    const windowSize = 10; // ±10 свечей для поиска локального минимума
    
    for (let partIndex = 0; partIndex < parts.length; partIndex++) {
        const part = parts[partIndex];
        const localMinima = [];
        
        // Находим все локальные минимумы в текущей части
        for (let i = 0; i < part.length; i++) {
            const currentClose = part[i][4];
            let isMin = true;
            
            // Проверяем левую сторону
            for (let j = Math.max(0, i - windowSize); j < i; j++) {
                if (part[j][4] <= currentClose) {
                    isMin = false;
                    break;
                }
            }
            
            if (!isMin) continue;
            
            // Проверяем правую сторону
            for (let j = i + 1; j <= Math.min(part.length - 1, i + windowSize); j++) {
                if (part[j][4] <= currentClose) {
                    isMin = false;
                    break;
                }
            }
            
            if (isMin) {
                localMinima.push(part[i]);
            }
        }
        
        // Step 3: Фильтруем минимумы где close <= currentPrice
        const filteredMinima = localMinima.filter(candle => candle[4] <= currentPrice);
        console.log(filteredMinima);
        
        // Step 4: Находим самый низкий минимум в этой части
        if (filteredMinima.length > 0) {
            results.push({
                closePrice: filteredMinima[0][4],
                dateTime: formatShort(filteredMinima[0][0])
            });
        }
    }
    
    return results;
}

module.exports = {
    findMinima
}