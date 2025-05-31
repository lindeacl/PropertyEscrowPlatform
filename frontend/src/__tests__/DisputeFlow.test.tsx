import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DisputeFlow from '../pages/DisputeFlow';

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
    initiateDispute: jest.fn().mockResolvedValue({
      transactionHash: '0xdispute123',
      status: 'success',
    }),
    resolveDispute: jest.fn().mockResolvedValue({
      transactionHash: '0xresolve123',
      status: 'success',
    }),
    getEscrowDetails: jest.fn().mockResolvedValue({
      id: '1',
      propertyName: 'Test Property',
      status: 'Funded',
      dispute: {
        active: false,
        reason: '',
        initiatedBy: null,
        resolution: '',
      },
      buyer: '0x1234567890123456789012345678901234567890',
      seller: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
      arbiter: '0xArbiter123456789012345678901234567890',
    }),
    isLoading: false,
    error: null,
  })
}));

const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('DisputeFlow Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dispute initiation form when no active dispute', async () => {
    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/initiate dispute/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/dispute reason/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit dispute/i })).toBeInTheDocument();
    });
  });

  test('validates dispute reason is provided', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /submit dispute/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/dispute reason is required/i)).toBeInTheDocument();
    });
  });

  test('validates dispute reason meets minimum length', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    const reasonInput = screen.getByLabelText(/dispute reason/i);
    await user.type(reasonInput, 'Too short');
    
    const submitButton = screen.getByRole('button', { name: /submit dispute/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/reason must be at least 20 characters/i)).toBeInTheDocument();
    });
  });

  test('successfully submits dispute with valid reason', async () => {
    const mockInitiateDispute = jest.fn().mockResolvedValue({
      transactionHash: '0xdispute123',
      status: 'success',
    });

    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      initiateDispute: mockInitiateDispute,
      resolveDispute: jest.fn(),
      getEscrowDetails: jest.fn().mockResolvedValue({
        id: '1',
        propertyName: 'Test Property',
        status: 'Funded',
        dispute: { active: false },
        buyer: '0x1234567890123456789012345678901234567890',
        seller: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
        arbiter: '0xArbiter123456789012345678901234567890',
      }),
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    const reasonInput = screen.getByLabelText(/dispute reason/i);
    await user.type(reasonInput, 'Property inspection revealed significant structural damage not disclosed by seller');
    
    const submitButton = screen.getByRole('button', { name: /submit dispute/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInitiateDispute).toHaveBeenCalledWith(
        '1',
        'Property inspection revealed significant structural damage not disclosed by seller'
      );
    });
  });

  test('displays active dispute information when dispute exists', async () => {
    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      initiateDispute: jest.fn(),
      resolveDispute: jest.fn(),
      getEscrowDetails: jest.fn().mockResolvedValue({
        id: '1',
        propertyName: 'Test Property',
        status: 'Disputed',
        dispute: {
          active: true,
          reason: 'Property condition issues',
          initiatedBy: '0x1234567890123456789012345678901234567890',
          resolution: '',
        },
        buyer: '0x1234567890123456789012345678901234567890',
        seller: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
        arbiter: '0xArbiter123456789012345678901234567890',
      }),
      isLoading: false,
      error: null,
    });

    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/active dispute/i)).toBeInTheDocument();
      expect(screen.getByText(/property condition issues/i)).toBeInTheDocument();
      expect(screen.getByText(/initiated by buyer/i)).toBeInTheDocument();
    });
  });

  test('shows resolution form for arbiter when dispute is active', async () => {
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: '0xArbiter123456789012345678901234567890',
      isConnected: true,
      balance: '10.5',
      chainId: '0x89',
    });

    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      initiateDispute: jest.fn(),
      resolveDispute: jest.fn(),
      getEscrowDetails: jest.fn().mockResolvedValue({
        id: '1',
        propertyName: 'Test Property',
        status: 'Disputed',
        dispute: {
          active: true,
          reason: 'Property condition issues',
          initiatedBy: '0x1234567890123456789012345678901234567890',
          resolution: '',
        },
        buyer: '0x1234567890123456789012345678901234567890',
        seller: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
        arbiter: '0xArbiter123456789012345678901234567890',
      }),
      isLoading: false,
      error: null,
    });

    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/resolve dispute/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/resolution decision/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resolve in favor of buyer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resolve in favor of seller/i })).toBeInTheDocument();
    });
  });

  test('successfully resolves dispute in favor of buyer', async () => {
    const mockResolveDispute = jest.fn().mockResolvedValue({
      transactionHash: '0xresolve123',
      status: 'success',
    });

    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: '0xArbiter123456789012345678901234567890',
      isConnected: true,
      balance: '10.5',
      chainId: '0x89',
    });

    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      initiateDispute: jest.fn(),
      resolveDispute: mockResolveDispute,
      getEscrowDetails: jest.fn().mockResolvedValue({
        id: '1',
        propertyName: 'Test Property',
        status: 'Disputed',
        dispute: {
          active: true,
          reason: 'Property condition issues',
          initiatedBy: '0x1234567890123456789012345678901234567890',
          resolution: '',
        },
        buyer: '0x1234567890123456789012345678901234567890',
        seller: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
        arbiter: '0xArbiter123456789012345678901234567890',
      }),
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    const resolutionInput = screen.getByLabelText(/resolution decision/i);
    await user.type(resolutionInput, 'After reviewing evidence, buyer claim is valid');

    const resolveBuyerButton = screen.getByRole('button', { name: /resolve in favor of buyer/i });
    await user.click(resolveBuyerButton);

    await waitFor(() => {
      expect(mockResolveDispute).toHaveBeenCalledWith(
        '1',
        'buyer',
        'After reviewing evidence, buyer claim is valid'
      );
    });
  });

  test('prevents non-participants from initiating disputes', async () => {
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: '0xRandomUser123456789012345678901234567890',
      isConnected: true,
      balance: '10.5',
      chainId: '0x89',
    });

    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/only buyer or seller can initiate disputes/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /submit dispute/i });
    expect(submitButton).toBeDisabled();
  });

  test('prevents non-arbiter from resolving disputes', async () => {
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: '0x1234567890123456789012345678901234567890', // buyer account
      isConnected: true,
      balance: '10.5',
      chainId: '0x89',
    });

    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      initiateDispute: jest.fn(),
      resolveDispute: jest.fn(),
      getEscrowDetails: jest.fn().mockResolvedValue({
        id: '1',
        propertyName: 'Test Property',
        status: 'Disputed',
        dispute: {
          active: true,
          reason: 'Property condition issues',
          initiatedBy: '0x1234567890123456789012345678901234567890',
          resolution: '',
        },
        buyer: '0x1234567890123456789012345678901234567890',
        seller: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
        arbiter: '0xArbiter123456789012345678901234567890',
      }),
      isLoading: false,
      error: null,
    });

    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/only the arbiter can resolve disputes/i)).toBeInTheDocument();
    });
  });

  test('displays dispute history and timeline', async () => {
    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      initiateDispute: jest.fn(),
      resolveDispute: jest.fn(),
      getEscrowDetails: jest.fn().mockResolvedValue({
        id: '1',
        propertyName: 'Test Property',
        status: 'Resolved',
        dispute: {
          active: false,
          reason: 'Property condition issues',
          initiatedBy: '0x1234567890123456789012345678901234567890',
          resolution: 'Resolved in favor of buyer after inspection',
          resolvedAt: new Date().toISOString(),
        },
        buyer: '0x1234567890123456789012345678901234567890',
        seller: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
        arbiter: '0xArbiter123456789012345678901234567890',
      }),
      isLoading: false,
      error: null,
    });

    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/dispute history/i)).toBeInTheDocument();
      expect(screen.getByText(/resolved in favor of buyer/i)).toBeInTheDocument();
      expect(screen.getByText(/dispute resolved/i)).toBeInTheDocument();
    });
  });

  test('has proper accessibility attributes', async () => {
    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    await waitFor(() => {
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Dispute Management');

      const reasonInput = screen.getByLabelText(/dispute reason/i);
      expect(reasonInput).toHaveAttribute('aria-required', 'true');
      expect(reasonInput).toHaveAttribute('aria-describedby');

      const submitButton = screen.getByRole('button', { name: /submit dispute/i });
      expect(submitButton).toHaveAttribute('aria-label');
    });
  });

  test('displays loading state during dispute submission', () => {
    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      initiateDispute: jest.fn(),
      resolveDispute: jest.fn(),
      getEscrowDetails: jest.fn(),
      isLoading: true,
      error: null,
    });

    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /submitting/i });
    expect(submitButton).toBeDisabled();
  });

  test('displays error message when dispute action fails', () => {
    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      initiateDispute: jest.fn(),
      resolveDispute: jest.fn(),
      getEscrowDetails: jest.fn(),
      isLoading: false,
      error: 'Failed to initiate dispute: insufficient gas',
    });

    render(
      <RouterWrapper>
        <DisputeFlow />
      </RouterWrapper>
    );

    expect(screen.getByText(/failed to initiate dispute: insufficient gas/i)).toBeInTheDocument();
  });
});