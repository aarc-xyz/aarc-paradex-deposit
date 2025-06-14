import { useState } from 'react';
import { useAccount, useDisconnect, useWalletClient } from 'wagmi';
import { useChainId, useSwitchChain } from 'wagmi';
import { ethers } from 'ethers';
import { AarcFundKitModal } from '@aarc-xyz/fundkit-web-sdk';
import { PARADEX_LAYERSWAP_DEPOSIT_ADDRESS, USDC_ON_ARBITRUM_ADDRESS, SupportedChainId, USDC_ABI } from '../constants';
import { Navbar } from './Navbar';
import StyledConnectButton from './StyledConnectButton';

export const ParadexDepositModal = ({ aarcModal }: { aarcModal: AarcFundKitModal }) => {
    const [amount, setAmount] = useState('1');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showProcessingModal, setShowProcessingModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    console.log("error", error)
    const { disconnect } = useDisconnect();
    const { data: walletClient } = useWalletClient();
    const { address } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    const handleDisconnect = () => {
        // Reset all state values
        setAmount('20');
        setIsProcessing(false);
        setShowProcessingModal(false);
        setError(null);

        // Disconnect wallet
        disconnect();
    };

    const transferToParadex = async () => {
        if (!walletClient || !address) return;

        try {
            setError(null);
            setIsProcessing(true);

            // Check if we're on Arbitrum, if not switch
            if (chainId !== SupportedChainId.ARBITRUM) {
                setShowProcessingModal(true);
                await switchChain({ chainId: SupportedChainId.ARBITRUM });
                
                // Wait for network switch to complete
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const provider = new ethers.BrowserProvider(walletClient);
            const signer = await provider.getSigner();
            
            const usdcContract = new ethers.Contract(
                USDC_ON_ARBITRUM_ADDRESS,
                USDC_ABI,
                signer
            );

            const amountInWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals

            // Check allowance
            const allowance = await usdcContract.allowance(address, PARADEX_LAYERSWAP_DEPOSIT_ADDRESS[SupportedChainId.ARBITRUM]);
            if (allowance < amountInWei) {
                // Need to approve first
                const approveTx = await usdcContract.approve(
                    PARADEX_LAYERSWAP_DEPOSIT_ADDRESS[SupportedChainId.ARBITRUM],
                    amountInWei
                );
                await approveTx.wait();
            }
            
            // Now do the transfer
            const tx = await usdcContract.transfer(
                PARADEX_LAYERSWAP_DEPOSIT_ADDRESS[SupportedChainId.ARBITRUM],
                amountInWei
            );

            // Wait for transaction to be mined
            await tx.wait();
            
            setShowProcessingModal(false);
            setAmount('');
            setIsProcessing(false);
        } catch (error) {
            console.error("Error transferring USDC to Paradex:", error);
            setError(error instanceof Error ? error.message : "An error occurred during the transfer");
            setShowProcessingModal(false);
            setIsProcessing(false);
        }
    };

    const handleDeposit = async () => {
        if (!address || !walletClient) return;

        try {
            setIsProcessing(true);
            setError(null);

            // Step 1: Use AArc to convert assets to USDC
            aarcModal.updateRequestedAmount(Number(amount));
            aarcModal.updateDestinationWalletAddress(address as `0x${string}`);

            aarcModal.updateEvents({
                onTransactionSuccess: () => {
                    aarcModal.close();
                    setShowProcessingModal(true);
                    transferToParadex();
                }
            });

            // Open the Aarc modal
            aarcModal.openModal();
            setAmount('');
            setIsProcessing(false);
        } catch (error) {
            console.error("Error preparing deposit:", error);
            setError(error instanceof Error ? error.message : "An error occurred during the deposit");
            setIsProcessing(false);
            aarcModal.close();
        }
    };

    const shouldDisableInteraction = !address;

    return (
        <div className="min-h-screen bg-aarc-bg grid-background">
            <Navbar handleDisconnect={handleDisconnect} />
            <main className="mt-24 gradient-border flex items-center justify-center mx-auto max-w-md shadow-[4px_8px_8px_4px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col items-center w-[440px] bg-[#2D2D2D] rounded-[24px] p-8 pb-[22px] gap-3">
                    {showProcessingModal ? (
                        // Processing Modal
                        <div className="flex flex-col items-center gap-4">
                            <img src="/paradex-name-logo.svg" alt="Paradex" className="w-32 h-16" />
                            <h3 className="text-[18px] font-semibold text-[#F6F6F6]">
                                {chainId !== SupportedChainId.ARBITRUM 
                                    ? "Switching to Arbitrum Network..."
                                    : "Transferring to "}
                                {chainId === SupportedChainId.ARBITRUM && (
                                    <a href="https://app.paradex.trade/portfolio?primary_tab=balances&active_tab=spot" target="_blank" rel="noopener noreferrer" className="underline text-[#A5E547]">Paradex</a>
                                )}
                            </h3>
                            <p className="text-[14px] text-[#C3C3C3] text-center">
                                {chainId !== SupportedChainId.ARBITRUM
                                    ? "Please approve the network switch in your wallet."
                                    : "Please confirm the transaction in your wallet to complete the deposit."}
                            </p>
                        </div>
                    ) : (
                        // Main Deposit Modal
                        <>
                            <div className="w-full relative">
                                {!address && <StyledConnectButton />}
                            </div>

                            {/* Amount Input */}
                            <div className="w-full">
                                <a href="https://app.paradex.trade/portfolio?primary_tab=balances&active_tab=spot" target="_blank" rel="noopener noreferrer" className="block">
                                    <h3 className="text-[14px] font-semibold text-[#F6F6F6] mb-4">Deposit in <span className="underline text-[#A5E547]">PARADEX</span></h3>
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
                                    The funds will be deposited in paradex.
                                </p>
                            </div>

                            {/* Continue Button */}
                            <button
                                onClick={handleDeposit}
                                disabled={isProcessing || shouldDisableInteraction}
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
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ParadexDepositModal;