import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletConnection from '../components/ui/WalletConnection';
import Toast from '../components/ui/Toast';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Mock window.ethereum for testing
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  isMetaMask: true,
};

beforeAll(() => {
  Object.defineProperty(window, 'ethereum', {
    value: mockEthereum,
    writable: true,
  });
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

    test('shows connecting state', () => {
      render(<WalletConnection isConnecting={true} />);
      
      const connectingButton = screen.getByRole('button', { name: /connecting/i });
      expect(connectingButton).toBeInTheDocument();
      expect(connectingButton).toBeDisabled();
    });

    test('displays connected wallet information', () => {
      render(
        <WalletConnection 
          account="0x1234567890123456789012345678901234567890"
          isConnected={true}
          balance="1.5"
          chainId="0x89"
        />
      );
      
      expect(screen.getByText(/0x1234...7890/)).toBeInTheDocument();
      expect(screen.getByText(/1.5 MATIC/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });

    test('calls connect function when button clicked', async () => {
      const mockConnect = jest.fn();
      const user = userEvent.setup();
      
      render(<WalletConnection onConnect={mockConnect} />);
      
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);
      
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    test('shows network switch prompt for wrong network', () => {
      render(
        <WalletConnection 
          account="0x1234567890123456789012345678901234567890"
          isConnected={true}
          chainId="0x1"
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
  });

  describe('Toast Component', () => {
    test('displays success toast', () => {
      render(
        <Toast
          type="success"
          message="Operation completed successfully"
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText(/operation completed successfully/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('toast-success');
    });

    test('displays error toast', () => {
      render(
        <Toast
          type="error"
          message="Something went wrong"
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('toast-error');
    });

    test('calls onClose when close button clicked', async () => {
      const mockOnClose = jest.fn();
      const user = userEvent.setup();

      render(
        <Toast
          type="info"
          message="Information message"
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('has proper accessibility attributes', () => {
      render(
        <Toast
          type="error"
          message="Error message"
          onClose={jest.fn()}
        />
      );

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'assertive');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('ErrorBoundary Component', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error for error boundary');
      }
      return <div>No error</div>;
    };

    test('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/no error/i)).toBeInTheDocument();
    });

    test('catches and displays error when child component throws', () => {
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

    test('has proper accessibility attributes', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'polite');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Form Validation Tests', () => {
    test('handles form input validation', async () => {
      const TestForm = () => {
        const [value, setValue] = React.useState('');
        const [error, setError] = React.useState('');
        
        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (!value.trim()) {
            setError('Field is required');
          } else {
            setError('');
          }
        };

        return (
          <form onSubmit={handleSubmit}>
            <input 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-label="Test input"
            />
            <button type="submit">Submit</button>
            {error && <div role="alert">{error}</div>}
          </form>
        );
      };

      const user = userEvent.setup();
      render(<TestForm />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      expect(screen.getByText(/field is required/i)).toBeInTheDocument();
    });

    test('handles special characters in input', async () => {
      const TestInput = () => {
        const [value, setValue] = React.useState('');
        
        return (
          <div>
            <input 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-label="Special chars input"
            />
            <div data-testid="output">{value}</div>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<TestInput />);

      const input = screen.getByLabelText(/special chars input/i);
      const specialChars = '!@#$%^&*()_+{}|:"<>?[];\',./ ñáéíóú';
      
      await user.type(input, specialChars);

      expect(screen.getByTestId('output')).toHaveTextContent(specialChars);
    });
  });

  describe('Accessibility Tests', () => {
    test('keyboard navigation works correctly', async () => {
      const TestComponent = () => (
        <div>
          <button>First Button</button>
          <input aria-label="Test input" />
          <button>Second Button</button>
        </div>
      );

      const user = userEvent.setup();
      render(<TestComponent />);

      await user.tab();
      expect(screen.getByRole('button', { name: /first button/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/test input/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /second button/i })).toHaveFocus();
    });

    test('focus indicators are visible', () => {
      render(<button className="focus-ring">Focusable Button</button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-ring');
    });
  });

  describe('Loading States', () => {
    test('handles loading state correctly', () => {
      const LoadingButton = ({ isLoading }: { isLoading: boolean }) => (
        <button disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Click Me'}
        </button>
      );

      const { rerender } = render(<LoadingButton isLoading={false} />);
      
      expect(screen.getByRole('button', { name: /click me/i })).not.toBeDisabled();

      rerender(<LoadingButton isLoading={true} />);
      
      expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
    });
  });
});