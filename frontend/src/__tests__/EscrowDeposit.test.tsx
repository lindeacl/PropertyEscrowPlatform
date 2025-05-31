import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EscrowDeposit from '../pages/EscrowDeposit';

// Mock hooks
jest.mock('../hooks/useWallet', () => ({
  useWallet: () => ({
    account: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    balance: '10.5',
    chainId: '0x89',
  })
}));

jest.mock('../hooks/useEscrow', () => ({
  useEscrow: () => ({
    depositFunds: jest.fn().mockResolvedValue({
      transactionHash: '0xdeposit123',
      status: 'success',
    }),
    getEscrowDetails: jest.fn().mockResolvedValue({
      id: '1',
      propertyName: 'Test Property',
      salePrice: '500000',
      status: 'Created',
      buyer: '0x1234567890123456789012345678901234567890',
      seller: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
      balance: '0',
    }),
    isLoading: false,
    error: null,
  })
}));

const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('EscrowDeposit Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders deposit form with escrow details', async () => {
    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/test property/i)).toBeInTheDocument();
      expect(screen.getByText(/500,000/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/deposit amount/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /deposit funds/i })).toBeInTheDocument();
    });
  });

  test('validates deposit amount is positive', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    const depositInput = screen.getByLabelText(/deposit amount/i);
    await user.type(depositInput, '-100');
    
    const depositButton = screen.getByRole('button', { name: /deposit funds/i });
    await user.click(depositButton);

    await waitFor(() => {
      expect(screen.getByText(/deposit amount must be positive/i)).toBeInTheDocument();
    });
  });

  test('validates deposit amount does not exceed wallet balance', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    const depositInput = screen.getByLabelText(/deposit amount/i);
    await user.type(depositInput, '15'); // More than wallet balance of 10.5
    
    const depositButton = screen.getByRole('button', { name: /deposit funds/i });
    await user.click(depositButton);

    await waitFor(() => {
      expect(screen.getByText(/insufficient wallet balance/i)).toBeInTheDocument();
    });
  });

  test('successfully submits deposit transaction', async () => {
    const mockDepositFunds = jest.fn().mockResolvedValue({
      transactionHash: '0xdeposit123',
      status: 'success',
    });

    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      depositFunds: mockDepositFunds,
      getEscrowDetails: jest.fn().mockResolvedValue({
        id: '1',
        propertyName: 'Test Property',
        salePrice: '500000',
        status: 'Created',
        buyer: '0x1234567890123456789012345678901234567890',
        seller: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
        balance: '0',
      }),
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    const depositInput = screen.getByLabelText(/deposit amount/i);
    await user.type(depositInput, '5.0');
    
    const depositButton = screen.getByRole('button', { name: /deposit funds/i });
    await user.click(depositButton);

    await waitFor(() => {
      expect(mockDepositFunds).toHaveBeenCalledWith('1', '5.0');
    });
  });

  test('displays success message after successful deposit', async () => {
    const mockDepositFunds = jest.fn().mockResolvedValue({
      transactionHash: '0xdeposit123',
      status: 'success',
    });

    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      depositFunds: mockDepositFunds,
      getEscrowDetails: jest.fn().mockResolvedValue({
        id: '1',
        propertyName: 'Test Property',
        salePrice: '500000',
        status: 'Created',
        buyer: '0x1234567890123456789012345678901234567890',
        seller: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
        balance: '0',
      }),
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    const depositInput = screen.getByLabelText(/deposit amount/i);
    await user.type(depositInput, '5.0');
    
    const depositButton = screen.getByRole('button', { name: /deposit funds/i });
    await user.click(depositButton);

    await waitFor(() => {
      expect(screen.getByText(/deposit successful/i)).toBeInTheDocument();
      expect(screen.getByText(/transaction hash/i)).toBeInTheDocument();
      expect(screen.getByText(/0xdeposit123/i)).toBeInTheDocument();
    });
  });

  test('displays error message when deposit fails', () => {
    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      depositFunds: jest.fn(),
      getEscrowDetails: jest.fn(),
      isLoading: false,
      error: 'Transaction failed: insufficient gas',
    });

    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    expect(screen.getByText(/transaction failed: insufficient gas/i)).toBeInTheDocument();
  });

  test('disables form during loading state', () => {
    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      depositFunds: jest.fn(),
      getEscrowDetails: jest.fn(),
      isLoading: true,
      error: null,
    });

    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    const depositButton = screen.getByRole('button', { name: /processing/i });
    expect(depositButton).toBeDisabled();
    
    const depositInput = screen.getByLabelText(/deposit amount/i);
    expect(depositInput).toBeDisabled();
  });

  test('prevents deposit if user is not the buyer', async () => {
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: '0xDifferentAddress123456789012345678901234567890',
      isConnected: true,
      balance: '10.5',
      chainId: '0x89',
    });

    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/only the buyer can deposit funds/i)).toBeInTheDocument();
    });

    const depositButton = screen.getByRole('button', { name: /deposit funds/i });
    expect(depositButton).toBeDisabled();
  });

  test('shows helpful gas fee estimation', async () => {
    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/estimated gas fee/i)).toBeInTheDocument();
      expect(screen.getByText(/0.002 MATIC/i)).toBeInTheDocument();
    });
  });

  test('displays escrow status badge correctly', async () => {
    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    await waitFor(() => {
      const statusBadge = screen.getByText(/created/i);
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('status-created');
    });
  });

  test('has proper accessibility attributes', async () => {
    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    await waitFor(() => {
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Deposit Funds to Escrow');

      const depositInput = screen.getByLabelText(/deposit amount/i);
      expect(depositInput).toHaveAttribute('aria-required', 'true');
      expect(depositInput).toHaveAttribute('aria-describedby');

      const depositButton = screen.getByRole('button', { name: /deposit funds/i });
      expect(depositButton).toHaveAttribute('aria-label');
    });
  });

  test('keyboard navigation works correctly', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    await waitFor(async () => {
      await user.tab();
      expect(screen.getByLabelText(/deposit amount/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /deposit funds/i })).toHaveFocus();
    });
  });

  test('shows transaction confirmation modal', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    const depositInput = screen.getByLabelText(/deposit amount/i);
    await user.type(depositInput, '5.0');
    
    const depositButton = screen.getByRole('button', { name: /deposit funds/i });
    await user.click(depositButton);

    await waitFor(() => {
      expect(screen.getByText(/confirm transaction/i)).toBeInTheDocument();
      expect(screen.getByText(/you are about to deposit 5.0 MATIC/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  test('allows cancellation of transaction', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <EscrowDeposit />
      </RouterWrapper>
    );

    const depositInput = screen.getByLabelText(/deposit amount/i);
    await user.type(depositInput, '5.0');
    
    const depositButton = screen.getByRole('button', { name: /deposit funds/i });
    await user.click(depositButton);

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      return user.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.queryByText(/confirm transaction/i)).not.toBeInTheDocument();
    });
  });
});