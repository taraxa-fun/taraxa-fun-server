import { PublicClient } from "viem";

import Token from "../../models/Tokens";

import { poolSC } from '../../config/web3';
import { Listed } from "EventTracker";

export const watchMigrationEvents = async (
    client: PublicClient
) => {
    console.log('Starting event watcher...');

    const unwatch = client.watchContractEvent({
        address: poolSC.address,
        abi: poolSC.abi,
        eventName: 'listed',
        onLogs: async (logs: any) => {

            const listed: Listed = logs[0].args;

            listed.tokenAddress = listed.tokenAddress.toLowerCase() as `0x${string}`;

            try {

                await Token.findOneAndUpdate(
                    { address: listed.tokenAddress },
                    {
                        listed: true,
                        pair_address: listed.pair,
                    },
                    { upsert: false, new: true }
                );

            }
            catch (error) {
                throw new Error("Error creating token: " + error);
            }

        },
        onError: error => {
            console.error('Error watching events');
        }
    });

    return unwatch;
};