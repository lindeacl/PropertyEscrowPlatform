import { useState, useEffect, useCallback } from 'react';

export interface WalletState {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
  chainId: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToPolygon: () => Promise<void>;
}

export const useWallet = (): WalletState => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState<string | null>(null);

  const isConnected = Boolean(account);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        
        // Get chain ID
        const currentChainId = await window.ethereum.request({
          method: 'eth_chainId',
        });
        setChainId(currentChainId);

        // Get balance
        const balanceWei = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest'],
        });
        
        // Convert from wei to ETH/MATIC
        const balanceEth = parseInt(balanceWei, 16) / Math.pow(10, 18);
        setBalance(balanceEth.toFixed(4));
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance('0');
    setChainId(null);
  }, []);

  const switchToPolygon = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }], // Polygon mainnet
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x89',
              chainName: 'Polygon Mainnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: ['https://polygon-rpc.com/'],
              blockExplorerUrls: ['https://polygonscan.com/'],
            }],
          });
        } catch (addError) {
          console.error('Failed to add Polygon network:', addError);
          throw addError;
        }
      } else {
        console.error('Failed to switch to Polygon network:', switchError);
        throw switchError;
      }
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = (newChainId: string) => {
        setChainId(newChainId);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account, disconnect]);

  return {
    account,
    isConnected,
    isConnecting,
    balance,
    chainId,
    connect,
    disconnect,
    switchToPolygon,
  };
};