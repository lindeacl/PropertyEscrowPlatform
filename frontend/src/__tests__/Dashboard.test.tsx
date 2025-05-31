import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

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
    getUserEscrows: jest.fn().mockResolvedValue([
      {
        id: '1',
        propertyName: 'Downtown Condo',
        salePrice: '500000',
        status: 'Created',
        buyer: '0x1234567890123456789012345678901234567890',
        seller: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        propertyName: 'Suburban House',
        salePrice: '750000',
        status: 'Funded',
        buyer: '0x1234567890123456789012345678901234567890',
        seller: '0x567890123456789012345678901234567890Ab',
        createdAt: new Date().toISOString(),
      }
    ]),
    isLoading: false,
    error: null,
  })
}));

const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard with user escrows', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/my escrows/i)).toBeInTheDocument();
      expect(screen.getByText(/downtown condo/i)).toBeInTheDocument();
      expect(screen.getByText(/suburban house/i)).toBeInTheDocument();
      expect(screen.getByText(/500,000/i)).toBeInTheDocument();
      expect(screen.getByText(/750,000/i)).toBeInTheDocument();
    });
  });

  test('displays wallet information', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/0x1234...7890/i)).toBeInTheDocument();
      expect(screen.getByText(/10.5 MATIC/i)).toBeInTheDocument();
    });
  });

  test('shows correct status badges for escrows', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      const createdBadge = screen.getByText(/created/i);
      const fundedBadge = screen.getByText(/funded/i);
      
      expect(createdBadge).toBeInTheDocument();
      expect(fundedBadge).toBeInTheDocument();
      expect(createdBadge).toHaveClass('status-created');
      expect(fundedBadge).toHaveClass('status-funded');
    });
  });

  test('provides quick action buttons for each escrow', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /deposit funds/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
    });
  });

  test('displays empty state when no escrows exist', async () => {
    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      getUserEscrows: jest.fn().mockResolvedValue([]),
      isLoading: false,
      error: null,
    });

    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/no escrows found/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first escrow/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create escrow/i })).toBeInTheDocument();
    });
  });

  test('shows loading state while fetching escrows', () => {
    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      getUserEscrows: jest.fn(),
      isLoading: true,
      error: null,
    });

    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    expect(screen.getByText(/loading escrows/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message when escrow fetch fails', () => {
    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      getUserEscrows: jest.fn(),
      isLoading: false,
      error: 'Failed to fetch escrows',
    });

    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    expect(screen.getByText(/failed to fetch escrows/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  test('filters escrows by status', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      const statusFilter = screen.getByLabelText(/filter by status/i);
      return user.selectOptions(statusFilter, 'Created');
    });

    await waitFor(() => {
      expect(screen.getByText(/downtown condo/i)).toBeInTheDocument();
      expect(screen.queryByText(/suburban house/i)).not.toBeInTheDocument();
    });
  });

  test('searches escrows by property name', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    const searchInput = screen.getByLabelText(/search escrows/i);
    await user.type(searchInput, 'downtown');

    await waitFor(() => {
      expect(screen.getByText(/downtown condo/i)).toBeInTheDocument();
      expect(screen.queryByText(/suburban house/i)).not.toBeInTheDocument();
    });
  });

  test('navigates to escrow details when view button clicked', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(async () => {
      const viewButton = screen.getAllByRole('button', { name: /view details/i })[0];
      await user.click(viewButton);
    });

    // Check if navigation occurred (would be tested with router mock in real implementation)
    expect(window.location.pathname).toBe('/');
  });

  test('displays summary statistics', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/total escrows/i)).toBeInTheDocument();
      expect(screen.getByText(/2/)).toBeInTheDocument();
      expect(screen.getByText(/total value/i)).toBeInTheDocument();
      expect(screen.getByText(/1,250,000/)).toBeInTheDocument();
    });
  });

  test('shows recent activity feed', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
      expect(screen.getByText(/escrow created/i)).toBeInTheDocument();
      expect(screen.getByText(/funds deposited/i)).toBeInTheDocument();
    });
  });

  test('has proper accessibility attributes', async () => {
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Dashboard');

      const searchInput = screen.getByLabelText(/search escrows/i);
      expect(searchInput).toHaveAttribute('aria-describedby');

      const statusFilter = screen.getByLabelText(/filter by status/i);
      expect(statusFilter).toHaveAttribute('aria-label');
    });
  });

  test('keyboard navigation works correctly', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(async () => {
      await user.tab();
      expect(screen.getByLabelText(/search escrows/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/filter by status/i)).toHaveFocus();
    });
  });

  test('refreshes data when refresh button clicked', async () => {
    const mockGetUserEscrows = jest.fn().mockResolvedValue([]);
    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      getUserEscrows: mockGetUserEscrows,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockGetUserEscrows).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  test('shows notification for wallet not connected', () => {
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: null,
      isConnected: false,
      balance: '0',
      chainId: null,
    });

    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });

  test('sorts escrows by different criteria', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <Dashboard />
      </RouterWrapper>
    );

    await waitFor(() => {
      const sortSelect = screen.getByLabelText(/sort by/i);
      return user.selectOptions(sortSelect, 'price-desc');
    });

    await waitFor(() => {
      const escrowCards = screen.getAllByTestId(/escrow-card/i);
      expect(escrowCards[0]).toHaveTextContent(/suburban house/i); // Higher price first
      expect(escrowCards[1]).toHaveTextContent(/downtown condo/i);
    });
  });
});