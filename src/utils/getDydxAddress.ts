import { ethers, keccak256, toUtf8Bytes } from "ethers";
import * as bip39 from "bip39";
import { BECH32_PREFIX } from "@dydxprotocol/v4-client-js";
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

export async function getDydxAddressFromSigner(signer: ethers.Signer): Promise<string> {
    const domain = {
        name: 'dYdX',
        version: '1',
        chainId: 1,
      };
      const types = { dYdX: [
        { name: 'action', type: 'string' },
      ]};
      const message = {
        action: 'dYdX Chain Onboarding',
      };
    
      const signature = await signer.signTypedData(domain, types, message);
      const hash = keccak256(toUtf8Bytes(signature));
      const bytes = Uint8Array.from(Buffer.from(hash.slice(2), 'hex'));
      const mnemonic = bip39.entropyToMnemonic(Buffer.from(bytes.slice(0, 16)));
    
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
        mnemonic,
        { prefix: BECH32_PREFIX }
      );
      const [account] = await wallet.getAccounts();
      return account.address;

}

  
