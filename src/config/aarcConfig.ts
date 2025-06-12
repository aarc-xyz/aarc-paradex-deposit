import {
  FKConfig,
  ThemeName,
  TransactionSuccessData,
  TransactionErrorData,
  SourceConnectorName,
} from "@aarc-xyz/fundkit-web-sdk";
import { DYDX_NOBLE_DEPOSIT_ADDRESS, SupportedChainId, USDC_ON_ARBITRUM_ADDRESS } from "../constants";

export const aarcConfig: FKConfig = {
  appName: "DYDX x Aarc",
  module: {
    exchange: {
      enabled: true,
    },
    onRamp: {
      enabled: true,
      onRampConfig: {},
    },
    bridgeAndSwap: {
      enabled: true,
      fetchOnlyDestinationBalance: false,
      routeType: "Value",
      connectors: [SourceConnectorName.ETHEREUM],
    },
  },
  destination: {
    contract: {
      contractAddress: DYDX_NOBLE_DEPOSIT_ADDRESS[SupportedChainId.ARBITRUM],
      contractName: "DYDX Deposit",
      contractPayload: "0x", // This will be updated dynamically
      contractGasLimit: "300000", // Standard gas limit, can be adjusted if needed
    },
    walletAddress: DYDX_NOBLE_DEPOSIT_ADDRESS[SupportedChainId.ARBITRUM],
    chainId: SupportedChainId.ARBITRUM, // Arbitrum chain ID
    tokenAddress: USDC_ON_ARBITRUM_ADDRESS, // USDC on Arbitrum
  },
  appearance: {
    roundness: 42,
    theme: ThemeName.DARK,
  },
  apiKeys: {
    aarcSDK: import.meta.env.VITE_AARC_API_KEY,
  },
  events: {
    onTransactionSuccess: (data: TransactionSuccessData) => {
      console.log("Transaction successful:", data);
    },
    onTransactionError: (data: TransactionErrorData) => {
      console.error("Transaction failed:", data);
    },
    onWidgetClose: () => {
      console.log("Widget closed");
    },
    onWidgetOpen: () => {
      console.log("Widget opened");
    },
  },
  origin: window.location.origin,

}; 