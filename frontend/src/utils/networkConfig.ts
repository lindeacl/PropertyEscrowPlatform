export const NETWORK_CONFIG = {
  localhost: {
    chainId: 31337,
    chainName: 'Localhost 8545',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['http://localhost:8545'],
    blockExplorerUrls: ['http://localhost:8545'],
  },
  polygon: {
    chainId: 137,
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrls: ['https://polygonscan.com/'],
  },
};

export const DEFAULT_NETWORK = 'localhost';