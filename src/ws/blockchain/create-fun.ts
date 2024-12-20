import { formatUnits, PublicClient } from "viem";
import { decodeAbiParameters } from 'viem'
import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';

import Token, { IToken } from "../../models/Tokens";
import User, { IUser } from "../../models/Users";

import { eventTrackerSC } from '../../config/web3';
import { getTokenMarketCap } from "../../utils/marketcap";

import { FunCreated } from "EventTracker";

export const watchFunCreationEvents = async (
    client: PublicClient,
    emitter: EventEmitter
) => {
    console.log('Starting event watcher...');

    const unwatch = client.watchContractEvent({
        address: eventTrackerSC.address,
        abi: eventTrackerSC.abi,
        eventName: 'funCreated',
        onLogs: async (logs: any) => {

            const funToken: FunCreated = logs[0].args;

            funToken.tokenAddress = funToken.tokenAddress.toLowerCase() as `0x${string}`;
            funToken.creator = funToken.creator.toLowerCase() as `0x${string}`;

            try {

                let user : IUser = await User.findOne({ wallet: funToken.creator });

                if (!user) {
                    user = await User.create({ wallet: funToken.creator });
                }

                const currentTokenMarketCap = await getTokenMarketCap(funToken.tokenAddress);
                const initialPrice = ((funToken.initialReserve * (10n ** 18n)) / funToken.totalSupply);

                const newToken: IToken = await Token.findOneAndUpdate(
                    { address: funToken.tokenAddress },
                    {
                        address: funToken.tokenAddress,
                        name: funToken.name,
                        symbol: funToken.symbol,
                        supply: (funToken.totalSupply).toString(),
                        description: funToken.data,
                        marketcap: currentTokenMarketCap.toString(),
                        user_wallet: funToken.creator,
                        initial_price: initialPrice.toString(),
                    },
                    { upsert: true, new: true }
                );

                const populatedToken = await Token.aggregate([
                    {
                        $match: {
                            _id: newToken._id
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
                        $project: {
                            address: 1,
                            name: 1,
                            symbol: 1,
                            image : 1,
                            supply: 1,
                            description: 1,
                            marketcap: 1,
                            replies_count: 1,
                            created_at: 1,
                            user: {
                                wallet: 1,
                                username: 1,
                                avatar: 1
                            }
                        }
                    }
                ]);

                emitter.emit('funCreated', populatedToken[0]);
            }
            catch (error) {
                throw new Error("Error creating token: " + error);
            }

        },
        onError: error => {
            console.error('Error watching events');
        },
    });

    return unwatch;
};