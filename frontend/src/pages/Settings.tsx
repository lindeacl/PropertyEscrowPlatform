import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { 
  User, 
  Shield, 
  Bell, 
  Wallet, 
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Moon,
  Sun
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { isConnected, address, chainId, balance } = useWallet();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    sms: false,
    escrowUpdates: true,
    disputeAlerts: true,
    systemMaintenance: false
  });
  const [kycStatus, setKycStatus] = useState({
    verified: false,
    level: 'Basic',
    documentStatus: 'Pending',
    lastUpdated: '2025-05-25'
  });
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  useEffect(() => {
    // Load user preferences from localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Load sample KYC data
    setKycStatus({
      verified: true,
      level: 'Enhanced',
      documentStatus: 'Approved',
      lastUpdated: '2025-05-30'
    });
  }, []);

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    // Apply dark mode class to document
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
    toast.success('Notification preferences updated');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getNetworkName = (chainId: number | null) => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum Mainnet',
      137: 'Polygon Mainnet',
      31337: 'Localhost',
      11155111: 'Sepolia Testnet'
    };
    return chainId ? networks[chainId] || `Chain ${chainId}` : 'Unknown';
  };

  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Account Settings</h1>
        <div className="flex items-center space-x-2">
          <Sun className="h-4 w-4 text-text-secondary" />
          <button
            onClick={handleDarkModeToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <Moon className="h-4 w-4 text-text-secondary" />
        </div>
      </div>

      {/* Profile Information */}
      <div className="card">
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-primary mr-3" />
          <h2 className="text-lg font-semibold text-text-primary">Profile Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Display Name
            </label>
            <input
              type="text"
              defaultValue="Property Investor"
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email Address
            </label>
            <input
              type="email"
              defaultValue="investor@example.com"
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              defaultValue="+1 (555) 123-4567"
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Time Zone
            </label>
            <select className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-text-primary">
              <option>UTC-8 (Pacific Time)</option>
              <option>UTC-5 (Eastern Time)</option>
              <option>UTC+0 (Greenwich Mean Time)</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="btn-primary">Save Changes</button>
        </div>
      </div>

      {/* KYC Status */}
      <div className="card">
        <div className="flex items-center mb-6">
          <Shield className="h-6 w-6 text-primary mr-3" />
          <h2 className="text-lg font-semibold text-text-primary">KYC Verification</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-background rounded-lg">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
              kycStatus.verified ? 'bg-success-50 text-success-600' : 'bg-accent-50 text-accent-600'
            }`}>
              {kycStatus.verified ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
            </div>
            <h3 className="font-medium text-text-primary">Verification Status</h3>
            <p className={`text-sm ${kycStatus.verified ? 'text-success-600' : 'text-accent-600'}`}>
              {kycStatus.verified ? 'Verified' : 'Pending'}
            </p>
          </div>

          <div className="text-center p-4 bg-background rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 text-primary mb-3">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="font-medium text-text-primary">KYC Level</h3>
            <p className="text-sm text-primary">{kycStatus.level}</p>
          </div>

          <div className="text-center p-4 bg-background rounded-lg">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-50 text-accent-600 mb-3">
              <User className="h-6 w-6" />
            </div>
            <h3 className="font-medium text-text-primary">Document Status</h3>
            <p className="text-sm text-success-600">{kycStatus.documentStatus}</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-700">
            <strong>Enhanced KYC Benefits:</strong> Access to higher transaction limits, priority dispute resolution, 
            and advanced escrow features. Last updated: {kycStatus.lastUpdated}
          </p>
        </div>

        {!kycStatus.verified && (
          <div className="mt-4 flex justify-center">
            <button className="btn-primary">
              Complete KYC Verification
            </button>
          </div>
        )}
      </div>

      {/* Wallet Management */}
      <div className="card">
        <div className="flex items-center mb-6">
          <Wallet className="h-6 w-6 text-primary mr-3" />
          <h2 className="text-lg font-semibold text-text-primary">Wallet Management</h2>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <h3 className="font-medium text-text-primary">Connected Wallet</h3>
                <p className="text-sm text-text-secondary font-mono">{formatAddress(address)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(address || '')}
                  className="p-2 text-text-secondary hover:text-text-primary"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button className="p-2 text-text-secondary hover:text-text-primary">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-background rounded-lg">
                <h4 className="text-sm font-medium text-text-secondary">Network</h4>
                <p className="text-text-primary">{getNetworkName(chainId)}</p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <h4 className="text-sm font-medium text-text-secondary">Balance</h4>
                <p className="text-text-primary font-mono">{parseFloat(balance).toFixed(4)} ETH</p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <h4 className="text-sm font-medium text-text-secondary">Chain ID</h4>
                <p className="text-text-primary">{chainId}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Wallet className="mx-auto h-12 w-12 text-text-secondary mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No Wallet Connected</h3>
            <p className="text-text-secondary mb-4">Connect your wallet to manage your account</p>
            <button className="btn-primary">Connect Wallet</button>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="card">
        <div className="flex items-center mb-6">
          <Bell className="h-6 w-6 text-primary mr-3" />
          <h2 className="text-lg font-semibold text-text-primary">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary">Email Notifications</h3>
              <p className="text-sm text-text-secondary">Receive updates via email</p>
            </div>
            <button
              onClick={() => handleNotificationChange('email', !notifications.email)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.email ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary">Browser Notifications</h3>
              <p className="text-sm text-text-secondary">Get real-time browser alerts</p>
            </div>
            <button
              onClick={() => handleNotificationChange('browser', !notifications.browser)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.browser ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.browser ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary">Escrow Updates</h3>
              <p className="text-sm text-text-secondary">Notifications for escrow status changes</p>
            </div>
            <button
              onClick={() => handleNotificationChange('escrowUpdates', !notifications.escrowUpdates)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.escrowUpdates ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.escrowUpdates ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary">Dispute Alerts</h3>
              <p className="text-sm text-text-secondary">Important dispute-related notifications</p>
            </div>
            <button
              onClick={() => handleNotificationChange('disputeAlerts', !notifications.disputeAlerts)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.disputeAlerts ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.disputeAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;