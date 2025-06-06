import { ethers } from 'ethers';

let cachedProvider: ethers.Provider | null = null;
let connectionMode: 'metamask' | 'local' | 'offline' = 'offline';

export const getProvider = async () => {
  if (cachedProvider && connectionMode !== 'offline') {
    return cachedProvider;
  }

  // First try local network since it's most reliable for development
  try {
    const localProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    // Test the connection before caching
    await localProvider.getBlockNumber();
    cachedProvider = localProvider;
    connectionMode = 'local';
    console.log('Connected to local blockchain');
    return cachedProvider;
  } catch (error) {
    console.warn('Local network unavailable:', error);
  }

  // Try MetaMask if available
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const metamaskProvider = new ethers.BrowserProvider(window.ethereum);
      // Test the connection
      await metamaskProvider.getNetwork();
      cachedProvider = metamaskProvider;
      connectionMode = 'metamask';
      console.log('Connected to MetaMask');
      return cachedProvider;
    } catch (error) {
      console.warn('MetaMask connection failed:', error);
    }
  }

  // Return null instead of broken provider to prevent JSON-RPC errors
  connectionMode = 'offline';
  console.warn('No blockchain connection available');
  return null;
};

export const connectToLocalNetwork = async () => {
  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    await provider.getBlockNumber(); // Test connection
    cachedProvider = provider;
    connectionMode = 'local';
    return provider;
  } catch (error) {
    console.warn('Local network unavailable:', error);
    connectionMode = 'offline';
    throw error;
  }
};

export const getWalletProvider = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      // Test the connection
      await provider.send('eth_requestAccounts', []);
      return provider;
    } catch (error) {
      console.warn('Wallet connection failed:', error);
      return null;
    }
  }
  return null;
};

export const getConnectionStatus = () => {
  return {
    mode: connectionMode,
    isConnected: cachedProvider !== null && connectionMode !== 'offline',
    provider: cachedProvider
  };
};

export const resetProvider = () => {
  cachedProvider = null;
  connectionMode = 'offline';
};