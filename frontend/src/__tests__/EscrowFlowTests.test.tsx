import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CreateEscrow from '../pages/CreateEscrow';
import Dashboard from '../pages/Dashboard';
import { WalletProvider } from '../contexts/WalletContext';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock wallet context for testing
const MockWalletProvider = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider>
      <WalletProvider>
        {children}
      </WalletProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Escrow Creation Flow', () => {
  test('renders escrow creation form with all required fields', () => {
    render(
      <MockWalletProvider>
        <CreateEscrow />
      </MockWalletProvider>
    );

    // Check for essential form fields
    expect(screen.getByLabelText(/property name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/buyer address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/seller address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create escrow/i })).toBeInTheDocument();
  });

  test('validates required fields before submission', async () => {
    const user = userEvent.setup();
    render(
      <MockWalletProvider>
        <CreateEscrow />
      </MockWalletProvider>
    );

    const submitButton = screen.getByRole('button', { name: /create escrow/i });
    await user.click(submitButton);

    // Should show validation errors for empty required fields
    await waitFor(() => {
      expect(screen.getByText(/property name is required/i)).toBeInTheDocument();
    });
  });

  test('fills out escrow form completely', async () => {
    const user = userEvent.setup();
    render(
      <MockWalletProvider>
        <CreateEscrow />
      </MockWalletProvider>
    );

    // Fill out form fields
    await user.type(screen.getByLabelText(/property name/i), 'Test Property');
    await user.type(screen.getByLabelText(/buyer address/i), '0x742d35Cc6635C0532925a3b8D');
    await user.type(screen.getByLabelText(/seller address/i), '0x8ba1f109551bD432803012645');
    await user.type(screen.getByLabelText(/amount/i), '1000');

    // Verify form fields are populated
    expect(screen.getByDisplayValue('Test Property')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0x742d35Cc6635C0532925a3b8D')).toBeInTheDocument();
  });
});

describe('Dashboard Escrow Display', () => {
  test('renders dashboard with escrow list section', () => {
    render(
      <MockWalletProvider>
        <Dashboard />
      </MockWalletProvider>
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/escrow/i)).toBeInTheDocument();
  });

  test('displays wallet connection status', () => {
    render(
      <MockWalletProvider>
        <Dashboard />
      </MockWalletProvider>
    );

    // Should show wallet connection UI
    expect(screen.getByText(/wallet/i)).toBeInTheDocument();
  });
});

describe('Error Handling', () => {
  test('handles wallet connection errors gracefully', () => {
    render(
      <MockWalletProvider>
        <CreateEscrow />
      </MockWalletProvider>
    );

    // Should not crash when wallet is not connected
    expect(screen.getByText(/create/i)).toBeInTheDocument();
  });

  test('displays appropriate error messages for invalid addresses', async () => {
    const user = userEvent.setup();
    render(
      <MockWalletProvider>
        <CreateEscrow />
      </MockWalletProvider>
    );

    const buyerField = screen.getByLabelText(/buyer address/i);
    await user.type(buyerField, 'invalid-address');
    
    // Trigger validation
    fireEvent.blur(buyerField);

    await waitFor(() => {
      expect(screen.getByText(/invalid address/i)).toBeInTheDocument();
    });
  });
});

describe('Accessibility Features', () => {
  test('form fields have proper labels', () => {
    render(
      <MockWalletProvider>
        <CreateEscrow />
      </MockWalletProvider>
    );

    // Check that all form inputs have associated labels
    const propertyInput = screen.getByLabelText(/property name/i);
    const buyerInput = screen.getByLabelText(/buyer address/i);
    const sellerInput = screen.getByLabelText(/seller address/i);

    expect(propertyInput).toHaveAttribute('aria-label');
    expect(buyerInput).toHaveAttribute('aria-label');
    expect(sellerInput).toHaveAttribute('aria-label');
  });

  test('buttons have accessible names', () => {
    render(
      <MockWalletProvider>
        <CreateEscrow />
      </MockWalletProvider>
    );

    const createButton = screen.getByRole('button', { name: /create escrow/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute('type', 'submit');
  });

  test('keyboard navigation works correctly', async () => {
    const user = userEvent.setup();
    render(
      <MockWalletProvider>
        <CreateEscrow />
      </MockWalletProvider>
    );

    const propertyInput = screen.getByLabelText(/property name/i);
    propertyInput.focus();

    // Tab should move to next field
    await user.tab();
    expect(screen.getByLabelText(/buyer address/i)).toHaveFocus();
  });
});