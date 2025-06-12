import { API_BASE_URL } from "../constants";

// Types for the request
interface SkipRouteRequest {
    amount_in: string;
    source_asset_chain_id: string;
    source_asset_denom: string;
    dest_asset_chain_id: string;
    dest_asset_denom: string;
    smart_relay: boolean;
    experimental_features: string[];
    allow_multi_tx: boolean;
    allow_unsafe: boolean;
    smart_swap_options: {
        split_routes: boolean;
        evm_swaps: boolean;
    };
    go_fast: boolean;
    cumulative_affiliate_fee_bps: string;
}

// Types for the response
interface Asset {
    denom: string;
    chain_id: string;
    origin_denom: string;
    origin_chain_id: string;
    trace: string;
    is_cw20: boolean;
    is_evm: boolean;
    is_svm: boolean;
    symbol: string;
    name: string;
    logo_uri: string;
    decimals: number;
    token_contract: string;
    description: string;
    coingecko_id: string;
    recommended_symbol: string;
}

interface Fee {
    fee_asset: Asset;
    bps_fee: string;
    bps_fee_amount: string;
    bps_fee_usd: string;
    source_chain_fee_amount: string;
    source_chain_fee_usd: string;
    destination_chain_fee_amount: string;
    destination_chain_fee_usd: string;
}

interface GoFastTransfer {
    from_chain_id: string;
    to_chain_id: string;
    fee: Fee;
    bridge_id: string;
    denom_in: string;
    denom_out: string;
    source_domain: string;
    destination_domain: string;
}

interface Transfer {
    port: string;
    channel: string;
    from_chain_id: string;
    to_chain_id: string;
    pfm_enabled: boolean;
    supports_memo: boolean;
    denom_in: string;
    denom_out: string;
    bridge_id: string;
    smart_relay: boolean;
    chain_id: string;
    dest_denom: string;
}

interface Operation {
    go_fast_transfer?: GoFastTransfer;
    transfer?: Transfer;
    tx_index: number;
    amount_in: string;
    amount_out: string;
}

interface EstimatedFee {
    fee_type: string;
    bridge_id: string;
    amount: string;
    usd_amount: string;
    origin_asset: Asset;
    chain_id: string;
    tx_index: number;
}

export interface SkipRouteResponse {
    source_asset_denom: string;
    source_asset_chain_id: string;
    dest_asset_denom: string;
    dest_asset_chain_id: string;
    amount_in: string;
    amount_out: string;
    operations: Operation[];
    chain_ids: string[];
    does_swap: boolean;
    estimated_amount_out: string;
    swap_venues: any[];
    txs_required: number;
    usd_amount_in: string;
    usd_amount_out: string;
    estimated_fees: EstimatedFee[];
    required_chain_addresses: string[];
    estimated_route_duration_seconds: number;
}

export async function getCosmosRoute(
    amount: string,
    sourceChainId: string,
    sourceAssetDenom: string,
    destChainId: string,
    destAssetDenom: string
): Promise<SkipRouteResponse> {
    const request: SkipRouteRequest = {
        amount_in: amount,
        source_asset_chain_id: sourceChainId,
        source_asset_denom: sourceAssetDenom,
        dest_asset_chain_id: destChainId,
        dest_asset_denom: destAssetDenom,
        smart_relay: true,
        experimental_features: ["hyperlane", "stargate", "eureka", "layer_zero"],
        allow_multi_tx: false,
        allow_unsafe: true,
        smart_swap_options: {
            split_routes: true,
            evm_swaps: true
        },
        go_fast: true,
        cumulative_affiliate_fee_bps: "0"
    };

    const response = await fetch(`${API_BASE_URL}/v2/fungible/route`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch route: ${response.statusText}`);
    }

    return response.json();
}
