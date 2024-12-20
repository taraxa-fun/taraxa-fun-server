export type CandleData = {
    open: bigint;
    high: bigint;
    low: bigint;
    close: bigint;
    volume: bigint;
    buyVolume: bigint;
    sellVolume: bigint;
    trades: number;
    buyTrades: number;
    sellTrades: number;
    startTime: Date;
    lastUpdate: Date;
    lastPrice: bigint;
    timeoutId?: NodeJS.Timeout;
}

export type WSMessage = {
    type: string;
    token_address?: string;
    candle: {
        open: string;
        high: string;
        low: string;
        close: string;
        volume: string;
        startTime: Date;
        lastUpdate: Date;
        lastPrice: string;
    };
}

export type WSClientMessage = {
    type: 'SUBSCRIBE_CANDLE' | 'UNSUBSCRIBE_CANDLE';
    token_address?: string;
}