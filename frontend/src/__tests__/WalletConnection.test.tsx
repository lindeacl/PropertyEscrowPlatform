import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletConnection from '../components/ui/WalletConnection';

// Mock the useWallet hook
jest.mock('../hooks/useWallet', () => ({
  useWallet: () => ({
    account: null,
    isConnected: false,
    isConnecting: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    balance: '0',
    chainId: null,
    switchToPolygon: jest.fn(),
  })
}));

describe('WalletConnection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders wallet connection button when not connected', () => {
    render(<WalletConnection />);
    
    const connectButton = screen.getByRole('button', { name: /connect wallet/i });
    expect(connectButton).toBeInTheDocument();
    expect(connectButton).not.toBeDisabled();
  });

  test('shows connecting state when wallet connection is in progress', () => {
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: null,
      isConnected: false,
      isConnecting: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
      balance: '0',
      chainId: null,
      switchToPolygon: jest.fn(),
    });

    render(<WalletConnection />);
    
    const connectingButton = screen.getByRole('button', { name: /connecting/i });
    expect(connectingButton).toBeInTheDocument();
    expect(connectingButton).toBeDisabled();
  });

  test('displays connected wallet information when connected', () => {
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      isConnecting: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
      balance: '1.5',
      chainId: '0x89',
      switchToPolygon: jest.fn(),
    });

    render(<WalletConnection />);
    
    expect(screen.getByText(/0x1234...7890/)).toBeInTheDocument();
    expect(screen.getByText(/1.5 MATIC/)).toBeInTheDocument();
    
    const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
    expect(disconnectButton).toBeInTheDocument();
  });

  test('calls connect function when connect button is clicked', async () => {
    const mockConnect = jest.fn();
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: null,
      isConnected: false,
      isConnecting: false,
      connect: mockConnect,
      disconnect: jest.fn(),
      balance: '0',
      chainId: null,
      switchToPolygon: jest.fn(),
    });

    const user = userEvent.setup();
    render(<WalletConnection />);
    
    const connectButton = screen.getByRole('button', { name: /connect wallet/i });
    await user.click(connectButton);
    
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  test('calls disconnect function when disconnect button is clicked', async () => {
    const mockDisconnect = jest.fn();
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      isConnecting: false,
      connect: jest.fn(),
      disconnect: mockDisconnect,
      balance: '1.5',
      chainId: '0x89',
      switchToPolygon: jest.fn(),
    });

    const user = userEvent.setup();
    render(<WalletConnection />);
    
    const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
    await user.click(disconnectButton);
    
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  test('shows network switch prompt when on wrong network', () => {
    const mockSwitchToPolygon = jest.fn();
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      isConnecting: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
      balance: '1.5',
      chainId: '0x1', // Ethereum mainnet instead of Polygon
      switchToPolygon: mockSwitchToPolygon,
    });

    render(<WalletConnection />);
    
    expect(screen.getByText(/wrong network/i)).toBeInTheDocument();
    const switchButton = screen.getByRole('button', { name: /switch to polygon/i });
    expect(switchButton).toBeInTheDocument();
  });

  test('calls switchToPolygon when switch network button is clicked', async () => {
    const mockSwitchToPolygon = jest.fn();
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: '0x1234567890123456789012345678901234567890',
      isConnected: true,
      isConnecting: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
      balance: '1.5',
      chainId: '0x1',
      switchToPolygon: mockSwitchToPolygon,
    });

    const user = userEvent.setup();
    render(<WalletConnection />);
    
    const switchButton = screen.getByRole('button', { name: /switch to polygon/i });
    await user.click(switchButton);
    
    expect(mockSwitchToPolygon).toHaveBeenCalledTimes(1);
  });

  test('handles wallet connection errors gracefully', async () => {
    const mockConnect = jest.fn().mockRejectedValue(new Error('User rejected request'));
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: null,
      isConnected: false,
      isConnecting: false,
      connect: mockConnect,
      disconnect: jest.fn(),
      balance: '0',
      chainId: null,
      switchToPolygon: jest.fn(),
    });

    const user = userEvent.setup();
    render(<WalletConnection />);
    
    const connectButton = screen.getByRole('button', { name: /connect wallet/i });
    await user.click(connectButton);
    
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  test('displays MetaMask installation prompt when not available', () => {
    // Mock ethereum as undefined
    delete (global as any).ethereum;

    render(<WalletConnection />);
    
    expect(screen.getByText(/metamask not detected/i)).toBeInTheDocument();
    const installButton = screen.getByRole('button', { name: /install metamask/i });
    expect(installButton).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<WalletConnection />);
    
    const connectButton = screen.getByRole('button', { name: /connect wallet/i });
    expect(connectButton).toHaveAttribute('aria-label');
    expect(connectButton).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('keyboard navigation works correctly', async () => {
    const user = userEvent.setup();
    render(<WalletConnection />);
    
    const connectButton = screen.getByRole('button', { name: /connect wallet/i });
    
    // Focus the button with Tab
    await user.tab();
    expect(connectButton).toHaveFocus();
    
    // Activate with Enter
    await user.keyboard('{Enter}');
    // Should call connect function (mocked)
  });
});