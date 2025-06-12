import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';
import { AarcFundKitModal } from '@aarc-xyz/fundkit-web-sdk';
import { useRef } from 'react';
import { AarcEthWalletConnector, wagmiConfig } from '@aarc-xyz/eth-connector';
import { aarcConfig } from './config/aarcConfig';
import DepositModal from './components/DydxDepositModal';

declare global {
  interface Window {
    __VUE__: boolean;
  }
}

const queryClient = new QueryClient();

function App() {
  const aarcModalRef = useRef(
    new AarcFundKitModal(aarcConfig, "dev", "https://deploy-preview-194--iframe-widget-v3.netlify.app")
  );

  const aarcModal = aarcModalRef.current;

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <AarcEthWalletConnector aarcWebClient={aarcModal} debugLog={true} >
          <DepositModal aarcModal={aarcModal} />
        </AarcEthWalletConnector>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;
