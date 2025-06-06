import { ethers } from 'ethers';
import { getProvider } from './provider';

export interface BlockchainConnection {
  provider: ethers.Provider;
  isConnected: boolean;
  chainId: number;
}

let cachedConnection: BlockchainConnection | null = null;

export const initializeBlockchainConnection = async (): Promise<BlockchainConnection> => {
  if (cachedConnection?.isConnected) {
    return cachedConnection;
  }

  try {
    const provider = getProvider();
    
    // Test with a simple call that doesn't require JSON parsing
    await Promise.race([
      provider.getBlockNumber(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 2000)
      )
    ]);

    // If successful, get network info
    const network = await provider.getNetwork();

    const connection: BlockchainConnection = {
      provider,
      isConnected: true,
      chainId: Number(network.chainId)
    };

    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.warn('Blockchain connection unavailable:', error);
    
    // Return fallback without attempting provider calls
    const fallbackConnection: BlockchainConnection = {
      provider: null as any, // Don't use provider if connection failed
      isConnected: false,
      chainId: 31337
    };

    cachedConnection = fallbackConnection;
    return fallbackConnection;
  }
};

export const getBlockchainConnection = (): BlockchainConnection | null => {
  return cachedConnection;
};

export const resetConnection = (): void => {
  cachedConnection = null;
};