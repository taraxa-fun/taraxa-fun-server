import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  PublicClient, 
  webSocket, 
  fallback 
} from "viem";
import { baseSepolia } from 'viem/chains';

import eventTrackerABI from "./abi/EventTracker.json";
import poolABI from "./abi/Pool.json";
import oracleABI from "./abi/ChainlinkAggregator.json";
import deployerABI from "./abi/Deployer.json";

import dotenv from 'dotenv';

dotenv.config();

const wsRPC = "wss://base-sepolia-rpc.publicnode.com";
const httpRPC = "https://base-sepolia-rpc.publicnode.com";

export const eventTrackerSC = {
  address: process.env.EVENT_TRACKER_ADDRESS as `0x${string}`,
  abi: eventTrackerABI
};

export const poolSC = {
  address: process.env.POOL_ADDRESS  as `0x${string}`,
  abi: poolABI
};

export const deployerSC = {
  address: process.env.DEPLOYER_ADDRESS as `0x${string}`,
  abi: deployerABI
}

export const oracleSC = {
  address: "0xe03e2C41c8c044192b3CE2d7AFe49370551c7f80" as `0x${string}`,
  abi: oracleABI
}

export const blockchainClientHTTP = createPublicClient({
  chain: baseSepolia,
  transport: http(httpRPC)
});

export const walletClient = createWalletClient({
  chain: baseSepolia,
  transport: http(httpRPC)
});

export const initBlockchainClientWS = (): PublicClient<any> => {

  const transportWSS = webSocket(wsRPC, {
    retryCount: 10,
    reconnect: {
      attempts : 10,
      delay: 1_000,
    },
    retryDelay: 30000,
    timeout: 60000,
    keepAlive: true
  });

  const client: any = createPublicClient({
    chain: baseSepolia,
    transport: fallback([
      http("https://base-sepolia-rpc.publicnode.com"),
      http("https://sepolia.base.org"),
      http("https://base-sepolia.gateway.tenderly.co"),
      http("https://base-sepolia.blockpi.network/v1/rpc/private")
    ], {rank : true}),
    batch: {
      multicall: true
    }

  });


  return client;
};