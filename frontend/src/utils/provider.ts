import { ethers } from 'ethers';

export const getProvider = () => {
  // For development, use the local blockchain
  const localProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  return localProvider;
};

export const connectToLocalNetwork = async () => {
  try {
    const provider = getProvider();
    // Test the connection
    await provider.getBlockNumber();
    return provider;
  } catch (error) {
    console.error('Failed to connect to local blockchain:', error);
    throw new Error('Local blockchain connection failed. Ensure Hardhat node is running on port 8545');
  }
};

export const getWalletProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  throw new Error('MetaMask not detected');
};