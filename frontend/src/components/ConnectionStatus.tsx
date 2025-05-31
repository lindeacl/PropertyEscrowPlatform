import React from 'react';
import { useWallet } from '../contexts/WalletContext';

const ConnectionStatus: React.FC = () => {
  const { isConnected, address, chainId } = useWallet();

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
          <div>
            <h3 className="text-yellow-800 font-medium">Wallet Not Connected</h3>
            <p className="text-yellow-700 text-sm">
              Connect your MetaMask wallet to interact with the platform. 
              Make sure to add the local network (Chain ID: 31337, RPC: http://127.0.0.1:8545).
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isLocalNetwork = chainId === 31337;

  return (
    <div className={`border rounded-lg p-4 mb-6 ${
      isLocalNetwork 
        ? 'bg-green-50 border-green-200' 
        : 'bg-orange-50 border-orange-200'
    }`}>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-3 ${
          isLocalNetwork ? 'bg-green-400' : 'bg-orange-400'
        }`}></div>
        <div>
          <h3 className={`font-medium ${
            isLocalNetwork ? 'text-green-800' : 'text-orange-800'
          }`}>
            {isLocalNetwork ? 'Connected to Local Network' : 'Wrong Network'}
          </h3>
          <p className={`text-sm ${
            isLocalNetwork ? 'text-green-700' : 'text-orange-700'
          }`}>
            {isLocalNetwork 
              ? `Wallet: ${address?.slice(0, 6)}...${address?.slice(-4)}`
              : 'Please switch to the local Hardhat network (Chain ID: 31337)'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;