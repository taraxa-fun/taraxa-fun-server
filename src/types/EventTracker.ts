export type FunCreated = {
    creator: `0x${string}`;
    funContract: `0x${string}`;
    tokenAddress: `0x${string}`;
    name: string;
    symbol: string;
    data: string;
    totalSupply: bigint;
    initialReserve: bigint;
    timestamp: bigint;
}

export type Listed = {
    tokenAddress: `0x${string}`;
    router: `0x${string}`;
    pair: `0x${string}`;
    liquidityAmount: bigint;
    tokenAmount: bigint;
    time : bigint;
    totalVolume: bigint;
}

export type PumpEmperorType = {
    tokenAddress: `0x${string}`;
    liquidityAmount: bigint;
    tokenAmount: bigint;
    time : bigint;
    totalVolume: bigint;
}

export type TradeCall = {
    caller: `0x${string}`;
    funContract: `0x${string}`;
    outAmount: bigint;
    inAmount: bigint;
    index: bigint;
    timestamp: bigint;
    tradeType: string;
}
