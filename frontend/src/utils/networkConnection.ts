import { ethers } from 'ethers';
import { getProvider } from './provider';

export const testBlockchainConnection = async (): Promise<boolean> => {
  try {
    const provider = getProvider();
    if (!provider) {
      console.error('No provider available');
      return false;
    }
    
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();
    
    console.log('Blockchain connection successful:', {
      blockNumber,
      chainId: network.chainId,
      name: network.name
    });
    
    return true;
  } catch (error) {
    console.error('Blockchain connection failed:', error);
    return false;
  }
};

export const getNetworkInfo = async () => {
  try {
    const provider = getProvider();
    if (!provider) {
      return {
        connected: false,
        error: 'No provider available'
      };
    }
    
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    return {
      connected: true,
      chainId: Number(network.chainId),
      name: network.name || 'localhost',
      blockNumber
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const formatConnectionError = (error: any): string => {
  if (error?.code === 'NETWORK_ERROR') {
    return 'Cannot connect to local blockchain. Ensure Hardhat node is running on port 8545';
  }
  
  if (error?.message?.includes('ECONNREFUSED')) {
    return 'Connection refused. Please start the local blockchain network';
  }
  
  if (error?.message?.includes('timeout')) {
    return 'Connection timeout. Please check network connectivity';
  }
  
  return error?.message || 'Unknown connection error';
};