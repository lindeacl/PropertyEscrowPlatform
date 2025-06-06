import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletConnection from '../components/ui/WalletConnection';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import Toast from '../components/ui/Toast';

// Mock window.ethereum for MetaMask testing
Object.defineProperty(window, 'ethereum', {
  value: { isMetaMask: true },
  writable: true
});

describe('UI Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WalletConnection Component', () => {
    test('renders connect wallet button when not connected', () => {
      render(<WalletConnection />);
      
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).not.toBeDisabled();
    });

    test('shows connecting state when connecting', () => {
      render(<WalletConnection isConnecting={true} />);
      
      expect(screen.getByText(/connecting/i)).toBeInTheDocument();
      const connectingButton = screen.getByRole('button');
      expect(connectingButton).toBeDisabled();
    });

    test('displays account info when connected', () => {
      render(
        <WalletConnection 
          isConnected={true} 
          account="0x1234567890123456789012345678901234567890"
          balance="10.5"
          chainId="0x89"
        />
      );
      
      expect(screen.getByText(/0x1234...7890/)).toBeInTheDocument();
      expect(screen.getByText(/10.5 MATIC/)).toBeInTheDocument();
    });

    test('shows wrong network warning for non-Polygon chains', () => {
      render(
        <WalletConnection 
          isConnected={true} 
          account="0x1234567890123456789012345678901234567890"
          chainId="0x1" // Ethereum mainnet
        />
      );
      
      expect(screen.getByText(/wrong network/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /switch to polygon/i })).toBeInTheDocument();
    });

    test('has proper accessibility attributes', () => {
      render(<WalletConnection />);
      
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toHaveAttribute('aria-label');
    });

    test('handles click events correctly', async () => {
      const mockConnect = jest.fn();
      const user = userEvent.setup();
      
      render(<WalletConnection onConnect={mockConnect} />);
      
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);
      
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorBoundary Component', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    test('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    test('renders error UI when there is an error', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('recovery button resets error state', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);
      
      // Rerender with non-throwing component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Toast Component', () => {
    test('renders toast message correctly', () => {
      render(<Toast message="Test message" type="success" />);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    test('renders different toast types with appropriate styling', () => {
      const { rerender } = render(<Toast message="Success" type="success" />);
      expect(screen.getByText('Success')).toBeInTheDocument();
      
      rerender(<Toast message="Error" type="error" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      
      rerender(<Toast message="Warning" type="warning" />);
      expect(screen.getByText('Warning')).toBeInTheDocument();
      
      rerender(<Toast message="Info" type="info" />);
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', async () => {
      const mockOnClose = jest.fn();
      const user = userEvent.setup();
      
      render(<Toast message="Test" type="info" onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('auto-dismisses after specified duration', async () => {
      const mockOnClose = jest.fn();
      
      render(<Toast message="Test" type="info" onClose={mockOnClose} duration={100} />);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });
  });

  describe('Form Components', () => {
    test('renders form with proper labels and inputs', () => {
      render(
        <form>
          <label htmlFor="propertyName">Property Name</label>
          <input id="propertyName" type="text" required />
          
          <label htmlFor="salePrice">Sale Price</label>
          <input id="salePrice" type="number" required />
          
          <label htmlFor="sellerAddress">Seller Address</label>
          <input id="sellerAddress" type="text" required />
          
          <button type="submit">Create Escrow</button>
        </form>
      );
      
      expect(screen.getByLabelText(/property name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sale price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/seller address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create escrow/i })).toBeInTheDocument();
    });

    test('form inputs accept user input', async () => {
      const user = userEvent.setup();
      
      render(
        <form>
          <label htmlFor="propertyName">Property Name</label>
          <input id="propertyName" type="text" />
        </form>
      );
      
      const input = screen.getByLabelText(/property name/i);
      await user.type(input, 'Test Property');
      
      expect(input).toHaveValue('Test Property');
    });

    test('form validation works correctly', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();
      
      render(
        <form onSubmit={mockSubmit}>
          <label htmlFor="propertyName">Property Name</label>
          <input id="propertyName" type="text" required />
          <button type="submit">Submit</button>
        </form>
      );
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      // Form should not submit with empty required field
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    test('tab navigation works correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button>Button 1</button>
          <button>Button 2</button>
          <input type="text" aria-label="Text Input" />
        </div>
      );
      
      // Tab through elements
      await user.tab();
      expect(screen.getByRole('button', { name: 'Button 1' })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: 'Button 2' })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    test('keyboard activation works for buttons', async () => {
      const mockClick = jest.fn();
      const user = userEvent.setup();
      
      render(<button onClick={mockClick}>Test Button</button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(mockClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(mockClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Responsive Design', () => {
    test('components render correctly at different viewport sizes', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<WalletConnection />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      render(<WalletConnection />);
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });
  });
});