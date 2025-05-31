import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { handleBlockchainError } from '../utils/errorHandling';
import { getWalletProvider, connectToLocalNetwork } from '../utils/provider';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  balance: string;
}

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    balance: '0'
  });

  const updateBalance = async (address: string, provider: ethers.BrowserProvider) => {
    try {
      const balance = await provider.getBalance(address);
      setWalletState(prev => ({
        ...prev,
        balance: ethers.formatEther(balance)
      }));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask to connect your wallet.');
    }

    try {
      // Request account access from MetaMask first
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = getWalletProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Try to get network info, but don't fail if it's not available
      let chainId = 1; // Default to mainnet
      try {
        const network = await provider.getNetwork();
        chainId = Number(network.chainId);
      } catch (networkError) {
        console.warn('Could not get network info, using default');
      }
      
      setWalletState({
        isConnected: true,
        address,
        provider,
        signer,
        chainId,
        balance: '0'
      });

      // Try to update balance, but don't fail connection if it doesn't work
      try {
        await updateBalance(address, provider);
      } catch (balanceError) {
        console.warn('Could not fetch balance:', balanceError);
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      throw new Error(handleBlockchainError(error));
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      balance: '0'
    });
  };

  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error(`Chain ${targetChainId} not added to wallet`);
      }
      throw error;
    }
  };

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      }
    };

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      setWalletState(prev => ({ ...prev, chainId: newChainId }));
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        ...walletState,
        connectWallet,
        disconnectWallet,
        switchNetwork
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}