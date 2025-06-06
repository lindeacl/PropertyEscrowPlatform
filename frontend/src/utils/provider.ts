import { ethers } from 'ethers';

let cachedProvider: ethers.Provider | null = null;

export const getProvider = () => {
  if (cachedProvider) {
    return cachedProvider;
  }

  // Try to use MetaMask first
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      cachedProvider = new ethers.BrowserProvider(window.ethereum);
      return cachedProvider;
    } catch (error) {
      console.warn('Failed to connect to MetaMask:', error);
    }
  }

  // Fallback to local network
  try {
    cachedProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    return cachedProvider;
  } catch (error) {
    console.warn('Failed to connect to local network:', error);
    // Return a minimal provider that won't cause JSON-RPC errors
    cachedProvider = new ethers.JsonRpcProvider();
    return cachedProvider;
  }
};

export const connectToLocalNetwork = async () => {
  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    await provider.getBlockNumber(); // Test connection
    cachedProvider = provider;
    return provider;
  } catch (error) {
    console.warn('Local network unavailable:', error);
    throw error;
  }
};

export const getWalletProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
};