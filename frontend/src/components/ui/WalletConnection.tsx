import React from 'react';
import { Wallet, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';

interface WalletConnectionProps {
  account?: string | null;
  isConnected?: boolean;
  isConnecting?: boolean;
  balance?: string;
  chainId?: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSwitchNetwork?: () => void;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({
  account = null,
  isConnected = false,
  isConnecting = false,
  balance = '0',
  chainId = null,
  onConnect = () => {},
  onDisconnect = () => {},
  onSwitchNetwork = () => {}
}) => {
  const isPolygon = chainId === '0x89';
  const isWrongNetwork = isConnected && !isPolygon;

  if (!window.ethereum) {
    return (
      <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-yellow-600" />
        <div>
          <p className="text-sm font-medium text-yellow-800">MetaMask Not Detected</p>
          <a 
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1 px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
            aria-label="Install MetaMask browser extension"
          >
            Install MetaMask
          </a>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <button 
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
        aria-label="Connecting to wallet"
      >
        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
        Connecting...
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button 
        onClick={onConnect}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        aria-label="Connect wallet to access escrow platform"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
        <WifiOff className="w-5 h-5 text-red-600" />
        <div>
          <p className="text-sm font-medium text-red-800">Wrong Network</p>
          <button 
            onClick={onSwitchNetwork}
            className="inline-block mt-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            aria-label="Switch to Polygon network"
          >
            Switch to Polygon
          </button>
        </div>
      </div>
    );
  }

  const formatAddress = (address: string) => 
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <CheckCircle className="w-5 h-5 text-green-600" />
      <div className="flex-1">
        <p className="text-sm font-medium text-green-800">
          {formatAddress(account!)}
        </p>
        <p className="text-xs text-green-600">
          {balance} MATIC
        </p>
      </div>
      <button 
        onClick={onDisconnect}
        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        aria-label="Disconnect wallet"
      >
        Disconnect
      </button>
    </div>
  );
};

export default WalletConnection;