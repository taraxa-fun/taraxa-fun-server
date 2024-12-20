import { EventEmitter } from "ws";
import CandleStick1M, { ICandle } from "../../models/CandleSticks1M";
import Token from "../../models/Tokens";
import { TradeCall, CandleData, WSMessage } from "../../types";


let currentCandles: {
    [key: string]: CandleData;
} = {};

export const INTERVAL = 60 * 1000; /// 1min

const calculateMax = (a: bigint, b: bigint): bigint => {
    return a > b ? a : b;
};

const calculateMin = (a: bigint, b: bigint): bigint => {
    return a < b ? a : b;
};

const getKey = (tokenAddress: string, time: Date): string => {
    return `${tokenAddress.toLowerCase()}-${time.getTime()}`;
};

const calculateStartTime = (timestamp: number): Date => {
    return new Date(Math.floor(timestamp / INTERVAL) * INTERVAL);
};

const calculatePrice = (trade: TradeCall): bigint => {

    const isBuy = trade.tradeType === 'buy';

    const PRECISION = 18n;

    if (isBuy) {
        return (trade.inAmount * (10n ** PRECISION)) / trade.outAmount;
    } else {
        return (trade.outAmount * (10n ** PRECISION)) / trade.inAmount;
    }
};

const calculateVolume = (trade: TradeCall): bigint => {
    return trade.tradeType === 'buy'
        ? trade.outAmount
        : trade.inAmount;
};

const setupCandleSaveTimeout = (key: string, startTime: Date) => {
    const timeoutDuration = INTERVAL - (Date.now() - startTime.getTime());

    const timeoutId = setTimeout(async () => {
        if (currentCandles[key]) {
            await saveCandle(key, currentCandles[key]);
            delete currentCandles[key];
        }
    }, timeoutDuration);

    timeoutId.unref();

    return timeoutId;
};

const saveCandle = async (key: string, candle: CandleData) => {

    const [tokenAddress] = key.split('-');
    try {
        await CandleStick1M.findOneAndUpdate(
            {
                token_address: tokenAddress,
                time: candle.startTime.getTime().toString()
            },
            {
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volume,
                buyVolume: candle.buyVolume,
                sellVolume: candle.sellVolume,
                trades: candle.trades,
                buyTrades: candle.buyTrades,
                sellTrades: candle.sellTrades
            },
            { upsert: true, new: true }
        );

    } catch (error) {
        console.error(`Error saving candlestick for ${tokenAddress}:`, error);
        throw error;
    }
};

const initializeCandle = async (trade: TradeCall, price: bigint, volume: bigint): Promise<CandleData> => {
    const isBuy = trade.tradeType === 'buy';
    const startTime = calculateStartTime(Number(trade.timestamp) * 1000);
    const key = getKey(trade.funContract.toLowerCase(), startTime);

    let openPrice: bigint;

    const previousCandle = await CandleStick1M.findOne({
        token_address: trade.funContract.toLowerCase(),
        time: {
            $lt: startTime.toISOString()
        }
    }).sort({ time: -1 });

    if (previousCandle) {
        openPrice = BigInt(previousCandle.close);
    }
    else {
        const token = await Token.findOne({ address: trade.funContract.toLowerCase() });
        openPrice = BigInt(token.initial_price);
    }




    const candle: CandleData = {
        open: openPrice,
        high: calculateMax(openPrice, price),
        low: calculateMin(openPrice, price),
        close: BigInt(price),
        volume: BigInt(volume),
        buyVolume: isBuy ? BigInt(volume) : BigInt(0),
        sellVolume: isBuy ? BigInt(0) : volume,
        trades: 1,
        buyTrades: isBuy ? 1 : 0,
        sellTrades: isBuy ? 0 : 1,
        startTime: startTime,
        lastUpdate: new Date(Number(trade.timestamp) * 1000),
        lastPrice: price,
        timeoutId: undefined
    };

    candle.timeoutId = setupCandleSaveTimeout(key, startTime);

    return candle;
};

const updateCandle = (candle: CandleData, trade: TradeCall, price: bigint, volume: bigint): CandleData => {

    const isBuy = trade.tradeType === 'buy';

    const c = {
        ...candle,
        high: calculateMax(candle.high, price),
        low: calculateMin(candle.low, price),
        close: price,
        volume: candle.volume + volume,
        buyVolume: candle.buyVolume + (isBuy ? volume : BigInt(0)),
        sellVolume: candle.sellVolume + (isBuy ? BigInt(0) : volume),
        trades: candle.trades + 1,
        buyTrades: candle.buyTrades + (isBuy ? 1 : 0),
        sellTrades: candle.sellTrades + (isBuy ? 0 : 1),
        lastUpdate: new Date(Number(trade.timestamp) * 1000),
        lastPrice: price,
        timeoutId: candle.timeoutId
    };

    return c;
};

export const processTrade = async (trade: TradeCall, emitter: EventEmitter): Promise<void> => {
    const timestamp = Number(trade.timestamp) * 1000;
    const tokenAddress = trade.funContract.toLowerCase();
    const price = calculatePrice(trade);
    const volume = calculateVolume(trade);
    const startTime = calculateStartTime(timestamp);
    const key = getKey(tokenAddress, startTime);

    let wsMessage: WSMessage;

    if (currentCandles[key]) {
        currentCandles[key] = updateCandle(currentCandles[key], trade, price, volume);

        await saveCandle(key, currentCandles[key]);

        wsMessage = {
            type: 'CANDLE_UPDATE',
            token_address: tokenAddress,
            candle: {
                open: currentCandles[key].open.toString(),
                high: currentCandles[key].high.toString(),
                low: currentCandles[key].low.toString(),
                close: currentCandles[key].close.toString(),
                volume: currentCandles[key].volume.toString(),
                startTime: currentCandles[key].startTime,
                lastUpdate: currentCandles[key].lastUpdate,
                lastPrice: currentCandles[key].lastPrice.toString()
            }
        };
    }
    else {
        currentCandles[key] = await initializeCandle(trade, price, volume);

        await saveCandle(key, currentCandles[key]);

        wsMessage = {
            type: 'NEW_CANDLE',
            token_address: tokenAddress,
            candle: {
                open: currentCandles[key].open.toString(),
                high: currentCandles[key].high.toString(),
                low: currentCandles[key].low.toString(),
                close: currentCandles[key].close.toString(),
                volume: currentCandles[key].volume.toString(),
                startTime: currentCandles[key].startTime,
                lastUpdate: currentCandles[key].lastUpdate,
                lastPrice: currentCandles[key].lastPrice.toString()
            }
        };
    }

    emitter.emit('candle1MUpdated', wsMessage);
};

const cleanupResources = () => {
    Object.values(currentCandles).forEach(candle => {
        if (candle.timeoutId) {
            clearTimeout(candle.timeoutId);
        }
    });
    currentCandles = {};
};

process.on('SIGTERM', cleanupResources);
process.on('SIGINT', cleanupResources);

