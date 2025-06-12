import { API_BASE_URL } from '../constants';
import { getCosmosRoute } from './getCosmosRoute';

interface ERC20Approval {
    token_contract: string;
    spender: string;
    amount: string;
}

interface EVMTx {
    chain_id: string;
    to: string;
    value: string;
    data: string;
    required_erc20_approvals: ERC20Approval[];
    signer_address: string;
}

interface Msg {
    evm_tx: EVMTx;
}

interface Tx extends Msg {
    operations_indices: number[];
}

interface SkipMsgsResponse {
    msgs: Msg[];
    txs: Tx[];
    estimated_fees: {
        fee_type: string;
        bridge_id: string;
        amount: string;
        usd_amount: string;
        origin_asset: {
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
        };
        chain_id: string;
        tx_index: number;
    }[];
}

export async function executeIBCSwap(
    amount: string,
    sourceChainId: string,
    sourceAssetDenom: string,
    destChainId: string,
    destAssetDenom: string,
    addressList: string[],
    slippageTolerancePercent: string = "1"
): Promise<SkipMsgsResponse> {
    // First get the route
    const route = await getCosmosRoute(
        amount,
        sourceChainId,
        sourceAssetDenom,
        destChainId,
        destAssetDenom
    );

    // Then execute the swap with the route
    const request = {
        source_asset_denom: route.source_asset_denom,
        source_asset_chain_id: route.source_asset_chain_id,
        dest_asset_denom: route.dest_asset_denom,
        dest_asset_chain_id: route.dest_asset_chain_id,
        amount_in: route.amount_in,
        amount_out: route.amount_out,
        address_list: addressList,
        operations: route.operations,
        slippage_tolerance_percent: slippageTolerancePercent
    };

    const response = await fetch(`${API_BASE_URL}/v2/fungible/msgs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
    });

    if (!response.ok) {
        throw new Error(`Failed to execute IBC swap: ${response.statusText}`);
    }

    return response.json();
}
