export enum SupportedChainId {
    ARBITRUM = 42161
}

export type AddressMap = {
    [chainId: number]: string;
};

export const DYDX_NOBLE_DEPOSIT_ADDRESS: AddressMap = {
    [SupportedChainId.ARBITRUM]: '0xFE6e4C80AC3Bd9B849789C43c0D6c6A98B6880E3'
};

export const USDC_ON_ARBITRUM_ADDRESS = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";

export const INTERMEDIATE_OSMO_ADDRESS = "osmo1l8p5qxlwg52grsf63wtdtgtfzzqgjpfc526y4a" // we hold this address for now

export const BASE_RPC_URL = "https://mainnet.base.org";

export const API_BASE_URL = "https://go.cosmos.network/api/skip"