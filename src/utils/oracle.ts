import { taraxa } from "viem/chains";
import { createPublicClient, http } from "viem";
import { oracleSC } from "../config/web3";

const httpRPC = "https://rpc.mainnet.taraxa.io";

export const blockchainClientHTTP = createPublicClient({
  chain: taraxa,
  transport: http(httpRPC)
});

export const getTaraxaPrice = async () => {
  const res = await blockchainClientHTTP.readContract({
    address: oracleSC.address,
    abi: oracleSC.abi,
    functionName: 'latestAnswer',
  });

  return res;
}



