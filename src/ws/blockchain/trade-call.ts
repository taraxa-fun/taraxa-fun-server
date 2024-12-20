import { PublicClient } from "viem";
import { EventEmitter } from 'events';

import Token from "../../models/Tokens";
import User, { IUser } from "../../models/Users";
import Trade, { ITrade } from "../../models/Trades";

import { deployerSC, poolSC } from '../../config/web3';
import { getTokenMarketCap } from "../../utils/marketcap";

import { processTrade } from "../candles/candle-stick";
import { TradeCall } from "EventTracker";

export const watchTradeCallEvents = async (
    client: PublicClient,
    emitter: EventEmitter
) => {
    console.log('Starting event watcher...');

    const unwatch = client.watchContractEvent({
        address: poolSC.address,
        abi: poolSC.abi,
        eventName: 'tradeCall',
        onLogs: async (logs: any) => {
            const trade: TradeCall = logs[0].args;

            trade.caller = trade.caller.toLowerCase() as `0x${string}`;

            try {
                const currentTokenMarketCap = await getTokenMarketCap(trade.funContract);

                let token = await Token.findOneAndUpdate(
                    { address: (trade.funContract).toLowerCase() },
                    {
                        marketcap: currentTokenMarketCap.toString(),
                    },
                    { upsert: true, new: true }
                );
            
                let user: IUser | null;

                if (trade.caller == deployerSC.address) {
                    user = await User.findOne({ wallet: token.user_wallet });
                }
                else {

                    user = await User.findOne({ wallet: trade.caller });

                    if (!user) {
                        user = await User.create({ wallet: trade.caller });
                    }
                }

                const newTrade: ITrade = await Trade.create({
                    type: trade.tradeType,
                    outAmount: (trade.outAmount).toString(),
                    inAmount: (trade.inAmount).toString(),
                    hash: logs[0].transactionHash,
                    user_wallet: user.wallet,
                    token_address: trade.funContract,
                });


                await processTrade(trade, emitter);


                const populatedTrade = await Trade.aggregate([
                    {
                        $match: {
                            _id: newTrade._id
                        }
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user_wallet',
                            foreignField: 'wallet',
                            as: 'user'
                        }
                    },
                    {
                        $unwind: {
                            path: '$user',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: 'tokens',
                            localField: 'token_address',
                            foreignField: 'address',
                            as: 'token'
                        }
                    },
                    {
                        $unwind: {
                            path: '$token',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            type: 1,
                            outAmount: 1,
                            inAmount: 1,
                            index: 1,
                            hash: 1,
                            created_at: 1,
                            user: {
                                wallet: 1,
                                username: 1,
                                avatar: 1
                            },
                            token: {
                                address: 1,
                                marketcap: 1,
                                symbol: 1,
                                image: 1,
                                description : 1,
                                replies_count: 1
                            }
                        }
                    }
                ]);

                emitter.emit('tradeCall', populatedTrade[0]);
            }
            catch (error) {
                throw new Error("Error creating trade: " + error);
            }
        },
        onError: error => {
            console.error('Error watching events');
        }
    });

    return unwatch;
};