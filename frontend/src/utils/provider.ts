import { ethers } from 'ethers';

export const getProvider = () => {
  // For development, use the local blockchain with proper error handling
  const localProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545', {
    name: 'localhost',
    chainId: 31337
  });
  
  // Configure provider with retry and timeout
  localProvider.pollingInterval = 1000;
  
  return localProvider;
};

export const connectToLocalNetwork = async () => {
  try {
    const provider = getProvider();
    // Test the connection with timeout
    const blockNumberPromise = provider.getBlockNumber();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    
    await Promise.race([blockNumberPromise, timeoutPromise]);
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