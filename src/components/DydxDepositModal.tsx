import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { ethers } from 'ethers';
import { AarcFundKitModal } from '@aarc-xyz/fundkit-web-sdk';
import { Navbar } from './Navbar';
import StyledConnectButton from './StyledConnectButton';
import { NOBLE_BECH32_PREFIX} from "@dydxprotocol/v4-client-js";
import { DYDX_NOBLE_DEPOSIT_ADDRESS, INTERMEDIATE_OSMO_ADDRESS, SupportedChainId, USDC_ON_ARBITRUM_ADDRESS } from '../constants';
import { fromBech32, toBech32 } from '@cosmjs/encoding';
import { executeIBCSwap } from '../utils/executeIBCSwap';

export const DydxDepositModal = ({ aarcModal }: { aarcModal: AarcFundKitModal }) => {
    const [amount, setAmount] = useState('1');
    const [dydxAddress, setDydxAddress] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { disconnect } = useDisconnect();

    const { address } = useAccount();

    const handleDisconnect = () => {
        // Reset all state values
        setAmount('20');
        setIsProcessing(false);

        // Disconnect wallet
        disconnect();

    };

    // useEffect(() => {
    //     if (chain) {
    //         setIsWrongNetwork(chain.id !== BASE_CHAIN_ID);
    //     }
    // }, [chain]);

    const handleDeposit = async () => {
        if (!address) return;

        try {
            setIsProcessing(true);

            console.log("dydxAddress", dydxAddress);
            const { data } = fromBech32(dydxAddress);
            const nobleAddress = toBech32(NOBLE_BECH32_PREFIX, data);
            console.log("nobleAddress", nobleAddress);

            const amountInWei = ethers.parseUnits(amount, 6);

            const result = await executeIBCSwap(amountInWei.toString(), SupportedChainId.ARBITRUM.toString() , USDC_ON_ARBITRUM_ADDRESS, "noble-1","uusdc", [address, INTERMEDIATE_OSMO_ADDRESS, nobleAddress]);
            console.log("result", result);
            if(!result.msgs[0].evm_tx.data) {
                throw new Error("No data returned from Skip API");
            }

            // Use the pre-encoded data from Skip API
            const contractPayload = result.msgs[0].evm_tx.data;


            aarcModal.updateRequestedAmount(Number(amount));

            // Update Aarc's destination contract configuration
            aarcModal.updateDestinationContract({
                contractAddress: DYDX_NOBLE_DEPOSIT_ADDRESS[SupportedChainId.ARBITRUM],
                contractName: "DYDX Deposit",
                contractGasLimit: "800000",
                contractPayload: contractPayload,
                contractLogoURI: "https://dydx.exchange/icon.svg"
            });

            // Open the Aarc modal
            aarcModal.openModal();
            setAmount('');
            setIsProcessing(false);
        } catch (error) {
            console.error("Error preparing deposit:", error);
            setIsProcessing(false);
            aarcModal.close();
        }
    };

    const shouldDisableInteraction = !address;

    return (
        <div className="min-h-screen bg-aarc-bg grid-background">
            <Navbar handleDisconnect={handleDisconnect} />
            <main className="mt-24 gradient-border flex items-center justify-center mx-auto max-w-md shadow-[4px_8px_8px_4px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col items-center w-[440px] bg-[#2D2D2D] rounded-[24px]  p-8 pb-[22px] gap-3">

                    <div className="w-full relative">
                        {!address &&
                            <StyledConnectButton />}
                    </div>

                    {/* Amount Input */}
                    <div className="w-full">
                        <a href="https://dydx.trade/trade/BTC-USD" target="_blank" rel="noopener noreferrer" className="block">
                            <h3 className="text-[14px] font-semibold text-[#F6F6F6] mb-4">Deposit in <span className="underline text-[#A5E547]">dydx</span></h3>
                        </a>
                        <div className="flex items-center p-3 bg-[#2A2A2A] border border-[#424242] rounded-2xl">
                            <div className="flex items-center gap-3">
                                <img src="/usdc-icon.svg" alt="USDC" className="w-6 h-6" />
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="^[0-9]*[.,]?[0-9]*$"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                    className="w-full bg-transparent text-[18px] font-semibold text-[#F6F6F6] outline-none"
                                    placeholder="Enter amount"
                                    disabled={shouldDisableInteraction}
                                />
                            </div>
                        </div>
                    </div>

                    {/* dYdX Address Input */}
                    <div className="w-full">
                        <h3 className="text-[14px] font-semibold text-[#F6F6F6] mb-2">
                            dYdX Address: <span className="text-red-500">*</span>
                        </h3>
                        <div className={`flex items-center p-3 bg-[#2A2A2A] border ${!dydxAddress && !shouldDisableInteraction ? 'border-red-500' : 'border-[#424242]'} rounded-2xl`}>
                            <input
                                type="text"
                                value={dydxAddress}
                                onChange={(e) => setDydxAddress(e.target.value)}
                                className="w-full bg-transparent text-[18px] font-semibold text-[#F6F6F6] outline-none"
                                placeholder="Enter dYdX address"
                                disabled={shouldDisableInteraction}
                                required
                            />
                        </div>
                        {!dydxAddress && !shouldDisableInteraction && (
                            <p className="text-red-500 text-sm mt-1">dYdX address is required</p>
                        )}
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="flex gap-[14px] w-full">
                        {['1', '5', '10', '20'].map((value) => (
                            <button
                                key={value}
                                onClick={() => setAmount(value)}
                                disabled={shouldDisableInteraction}
                                className="flex items-center justify-center px-2 py-2 bg-[rgba(83,83,83,0.2)] border border-[#424242] rounded-lg h-[34px] flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-[14px] font-semibold text-[#F6F6F6]">{value} USDC</span>
                            </button>
                        ))}
                    </div>

                    {/* Warning Message */}
                    <div className="w-full flex gap-x-2 items-start p-4 bg-[rgba(255,183,77,0.05)] border border-[rgba(255,183,77,0.2)] rounded-2xl mt-2">
                        <img src="/info-icon.svg" alt="Info" className="w-4 h-4 mt-[2px]" />
                        <p className="text-xs font-bold text-[#F6F6F6] leading-5">
                            The funds will be deposited in dydx.
                        </p>
                    </div>

                    {/* Continue Button */}
                    <button
                        onClick={handleDeposit}
                        disabled={isProcessing || shouldDisableInteraction || !dydxAddress}
                        className="w-full h-11 mt-2 bg-[#A5E547] hover:opacity-90 text-[#003300] font-semibold rounded-2xl border border-[rgba(0,51,0,0.05)] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Continue'}
                    </button>

                    {/* Powered by Footer */}
                    <div className="flex flex-col items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-[#F6F6F6]">Powered by</span>
                            <img src="/aarc-logo-small.svg" alt="Aarc" />
                        </div>
                        <p className="text-[10px] text-[#C3C3C3]">
                            By using this service, you agree to Aarc <span className="underline cursor-pointer">terms</span>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DydxDepositModal;