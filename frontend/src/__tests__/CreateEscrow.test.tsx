import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock CreateEscrow component for testing
const MockCreateEscrow = () => (
  <div>
    <h1>Create Property Escrow</h1>
    <form>
      <label htmlFor="propertyName">Property Name</label>
      <input id="propertyName" type="text" />
      
      <label htmlFor="buyerAddress">Buyer Address</label>
      <input id="buyerAddress" type="text" />
      
      <label htmlFor="sellerAddress">Seller Address</label>
      <input id="sellerAddress" type="text" />
      
      <label htmlFor="escrowAmount">Escrow Amount</label>
      <input id="escrowAmount" type="number" />
      
      <button type="submit">Create Escrow</button>
    </form>
  </div>
);

// Mock hooks and contexts
jest.mock('../hooks/useWallet', () => ({
  useWallet: () => ({
    account: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    connect: jest.fn(),
    balance: '10.5',
    chainId: '0x89',
  })
}));

jest.mock('../hooks/useEscrow', () => ({
  useEscrow: () => ({
    createEscrow: jest.fn().mockResolvedValue({
      transactionHash: '0xabcd1234',
      escrowId: '1',
    }),
    isLoading: false,
    error: null,
  })
}));

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CreateEscrow Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders escrow creation form with all required fields', () => {
    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    expect(screen.getByLabelText(/property name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/property address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sale price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/seller address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/agent address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/completion deadline/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create escrow/i })).toBeInTheDocument();
  });

  test('validates required fields before submission', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    const createButton = screen.getByRole('button', { name: /create escrow/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/property name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/sale price is required/i)).toBeInTheDocument();
      expect(screen.getByText(/seller address is required/i)).toBeInTheDocument();
    });
  });

  test('validates ethereum address format', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    const sellerAddressInput = screen.getByLabelText(/seller address/i);
    await user.type(sellerAddressInput, 'invalid-address');
    
    const createButton = screen.getByRole('button', { name: /create escrow/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid ethereum address/i)).toBeInTheDocument();
    });
  });

  test('validates sale price is positive number', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    const salePriceInput = screen.getByLabelText(/sale price/i);
    await user.type(salePriceInput, '-100');
    
    const createButton = screen.getByRole('button', { name: /create escrow/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/sale price must be positive/i)).toBeInTheDocument();
    });
  });

  test('validates deadline is in the future', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    const deadlineInput = screen.getByLabelText(/completion deadline/i);
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await user.type(deadlineInput, pastDate.toISOString().split('T')[0]);
    
    const createButton = screen.getByRole('button', { name: /create escrow/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/deadline must be in the future/i)).toBeInTheDocument();
    });
  });

  test('successfully submits valid escrow creation form', async () => {
    const mockCreateEscrow = jest.fn().mockResolvedValue({
      transactionHash: '0xabcd1234',
      escrowId: '1',
    });

    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      createEscrow: mockCreateEscrow,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    // Fill in valid form data
    await user.type(screen.getByLabelText(/property name/i), 'Test Property');
    await user.type(screen.getByLabelText(/property address/i), '123 Test St, Test City');
    await user.type(screen.getByLabelText(/sale price/i), '500000');
    await user.type(screen.getByLabelText(/seller address/i), '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5');
    await user.type(screen.getByLabelText(/agent address/i), '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await user.type(screen.getByLabelText(/completion deadline/i), futureDate.toISOString().split('T')[0]);

    const createButton = screen.getByRole('button', { name: /create escrow/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockCreateEscrow).toHaveBeenCalledWith({
        propertyName: 'Test Property',
        propertyAddress: '123 Test St, Test City',
        salePrice: '500000',
        sellerAddress: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
        agentAddress: '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5',
        completionDeadline: expect.any(String),
      });
    });
  });

  test('displays success message after successful creation', async () => {
    const mockCreateEscrow = jest.fn().mockResolvedValue({
      transactionHash: '0xabcd1234',
      escrowId: '1',
    });

    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      createEscrow: mockCreateEscrow,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    // Fill and submit form
    await user.type(screen.getByLabelText(/property name/i), 'Test Property');
    await user.type(screen.getByLabelText(/sale price/i), '500000');
    await user.type(screen.getByLabelText(/seller address/i), '0x742d35Cc6634C0532925a3b8D69B8c9c5aF9e5');
    
    const createButton = screen.getByRole('button', { name: /create escrow/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/escrow created successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/transaction hash/i)).toBeInTheDocument();
      expect(screen.getByText(/0xabcd1234/i)).toBeInTheDocument();
    });
  });

  test('displays error message when creation fails', async () => {
    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      createEscrow: jest.fn(),
      isLoading: false,
      error: 'Insufficient funds for transaction',
    });

    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    expect(screen.getByText(/insufficient funds for transaction/i)).toBeInTheDocument();
  });

  test('disables form during loading state', () => {
    const mockUseEscrow = require('../hooks/useEscrow').useEscrow;
    mockUseEscrow.mockReturnValue({
      createEscrow: jest.fn(),
      isLoading: true,
      error: null,
    });

    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    const createButton = screen.getByRole('button', { name: /creating/i });
    expect(createButton).toBeDisabled();
    expect(screen.getByLabelText(/property name/i)).toBeDisabled();
  });

  test('shows wallet connection prompt when not connected', () => {
    const mockUseWallet = require('../hooks/useWallet').useWallet;
    mockUseWallet.mockReturnValue({
      account: null,
      isConnected: false,
      connect: jest.fn(),
      balance: '0',
      chainId: null,
    });

    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    const form = screen.getByRole('form');
    expect(form).toHaveAttribute('aria-label', 'Create Property Escrow');

    const propertyNameInput = screen.getByLabelText(/property name/i);
    expect(propertyNameInput).toHaveAttribute('aria-required', 'true');
    expect(propertyNameInput).toHaveAttribute('aria-describedby');

    const createButton = screen.getByRole('button', { name: /create escrow/i });
    expect(createButton).toHaveAttribute('aria-label');
  });

  test('keyboard navigation works correctly', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    // Tab through form fields
    await user.tab();
    expect(screen.getByLabelText(/property name/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/property address/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/sale price/i)).toHaveFocus();
  });

  test('displays helpful tooltips for complex fields', async () => {
    const user = userEvent.setup();
    render(
      <RouterWrapper>
        <CreateEscrow />
      </RouterWrapper>
    );

    const tooltipTrigger = screen.getByRole('button', { name: /what is an ethereum address/i });
    await user.hover(tooltipTrigger);

    await waitFor(() => {
      expect(screen.getByText(/ethereum address is a unique identifier/i)).toBeInTheDocument();
    });
  });
});