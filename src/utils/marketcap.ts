import { blockchainClientHTTP, poolSC } from "../config/web3";

export const getTokenMarketCap = async (tokenAddress: `0x${string}`)  => {
    try {
        
        const mkcap = await blockchainClientHTTP.readContract({
            address: poolSC.address,
            abi: poolSC.abi,
            functionName: "getCurrentCap",
            args: [tokenAddress]
        });

        return mkcap;
    }
    catch(e){
        throw new Error("Error getting token market cap: " + e);
    }
};