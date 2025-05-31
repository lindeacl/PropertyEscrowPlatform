import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Wallet, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const WalletConnection: React.FC = () => {
  const { isConnected, address, chainId, connectWallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      toast.success('Wallet connected successfully');
    } catch (error: any) {
      console.error('Connection failed:', error);
      
      if (error.message.includes('MetaMask is not installed')) {
        toast.error('Please install MetaMask to connect your wallet');
      } else if (error.message.includes('Parse error') || error.message.includes('JSON')) {
        toast.error('Please add the local network to MetaMask first');
        showNetworkInstructions();
      } else {
        toast.error('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const showNetworkInstructions = () => {
    const instructions = `
    To connect to the local blockchain:
    1. Open MetaMask
    2. Click "Add Network" 
    3. Use these settings:
       - Network Name: Localhost 8545
       - RPC URL: http://127.0.0.1:8545
       - Chain ID: 31337
       - Currency Symbol: ETH
    4. Save and switch to this network
    5. Try connecting again
    `;
    console.log(instructions);
  };

  const isLocalNetwork = chainId === 31337;

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <Wallet className="h-8 w-8 text-yellow-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              Connect Your Wallet
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              Connect MetaMask to interact with the escrow platform and manage your transactions.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>First time?</strong> Make sure to configure the local network in MetaMask:
              </p>
              <ul className="text-sm text-yellow-600 dark:text-yellow-400 list-disc ml-4 space-y-1">
                <li>Network Name: Localhost 8545</li>
                <li>RPC URL: http://127.0.0.1:8545</li>
                <li>Chain ID: 31337</li>
                <li>Currency: ETH</li>
              </ul>
            </div>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${
      isLocalNetwork 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
        : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
    }`}>
      <div className="flex items-center space-x-3">
        {isLocalNetwork ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-orange-600" />
        )}
        <div className="flex-1">
          <h3 className={`font-medium ${
            isLocalNetwork ? 'text-green-800 dark:text-green-200' : 'text-orange-800 dark:text-orange-200'
          }`}>
            {isLocalNetwork ? 'Connected to Local Network' : 'Wrong Network'}
          </h3>
          <p className={`text-sm ${
            isLocalNetwork ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'
          }`}>
            {isLocalNetwork 
              ? `Wallet: ${address?.slice(0, 6)}...${address?.slice(-4)}`
              : 'Please switch to the local Hardhat network (Chain ID: 31337)'
            }
          </p>
        </div>
        {!isLocalNetwork && (
          <button
            onClick={showNetworkInstructions}
            className="p-2 text-orange-600 hover:text-orange-700"
            title="Show network setup instructions"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default WalletConnection;