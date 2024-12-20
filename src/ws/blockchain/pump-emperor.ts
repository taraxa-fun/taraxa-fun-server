import { PublicClient } from "viem";

import Token from "../../models/Tokens";
import PumpEmperor from "../../models/PumpEmperors";

import { deployerSC } from '../../config/web3';
import { getTokenMarketCap } from "../../utils/marketcap";
import { PumpEmperorType } from "EventTracker";

export const watchPumpEmpororEvents = async (
    client: PublicClient
) => {
    console.log('Starting event watcher...');

    const unwatch = client.watchContractEvent({
        address: deployerSC.address,
        abi: deployerSC.abi,
        eventName: 'royal',
        onLogs: async (logs: any) => {

            console.log('Event logs:', logs);

            const pumpEmperor: PumpEmperorType = logs[0].args;

            pumpEmperor.tokenAddress = pumpEmperor.tokenAddress.toLowerCase() as `0x${string}`;

            try {

                const currentTokenMarketCap = await getTokenMarketCap(pumpEmperor.tokenAddress);

                await Token.findOneAndUpdate(
                    { address: pumpEmperor.tokenAddress },
                    {
                        marketcap: currentTokenMarketCap.toString(),
                    },
                    { upsert: false, new: true }
                );

                await PumpEmperor.create({
                    token_address: pumpEmperor.tokenAddress,
                    total_volume: (pumpEmperor.totalVolume).toString()
                });
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