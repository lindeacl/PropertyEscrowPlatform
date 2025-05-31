import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { 
  Home, 
  Plus, 
  FileText, 
  Settings, 
  Menu, 
  X, 
  Wallet,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const { isConnected, address, balance, connectWallet, disconnectWallet } = useWallet();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Create Escrow', href: '/create', icon: Plus },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-surface">
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-primary">Escrow Platform</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-text-secondary hover:text-text-primary"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 pb-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-background hover:text-text-primary'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-surface border-r border-border px-6">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-primary">Escrow Platform</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                            isActive
                              ? 'bg-primary text-white'
                              : 'text-text-secondary hover:text-text-primary hover:bg-background'
                          }`}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-surface px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-text-secondary lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            
            {/* Wallet connection */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {isConnected ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-x-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary hover:bg-background"
                  >
                    <Wallet className="h-4 w-4" />
                    <span className="font-mono">{formatAddress(address!)}</span>
                    <span className="text-text-secondary">|</span>
                    <span>{parseFloat(balance).toFixed(4)} ETH</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {profileOpen && (
                    <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-surface py-1 shadow-lg ring-1 ring-border">
                      <button
                        onClick={() => {
                          disconnectWallet();
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-text-primary hover:bg-background"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="btn-primary"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;