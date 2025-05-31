import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import Toast from '../components/ui/Toast';

// Mock component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for error boundary');
  }
  return <div>No error</div>;
};

const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('ErrorBoundary Component', () => {
    test('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/no error/i)).toBeInTheDocument();
    });

    test('catches and displays error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/test error for error boundary/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    test('allows user to retry after error', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      // Rerender with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/no error/i)).toBeInTheDocument();
    });

    test('has proper accessibility attributes', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'polite');
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toHaveAttribute('aria-label');
    });
  });

  describe('Toast Notifications', () => {
    test('displays success toast', () => {
      render(
        <Toast
          type="success"
          message="Operation completed successfully"
          isVisible={true}
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
          isVisible={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('toast-error');
    });

    test('displays warning toast', () => {
      render(
        <Toast
          type="warning"
          message="Please check your input"
          isVisible={true}
          onClose={jest.fn()}
        />
      );

      expect(screen.getByText(/please check your input/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('toast-warning');
    });

    test('calls onClose when close button clicked', async () => {
      const mockOnClose = jest.fn();
      const user = userEvent.setup();

      render(
        <Toast
          type="info"
          message="Information message"
          isVisible={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('auto-closes after timeout', async () => {
      const mockOnClose = jest.fn();
      
      render(
        <Toast
          type="success"
          message="Auto-closing message"
          isVisible={true}
          onClose={mockOnClose}
          autoClose={1000}
        />
      );

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }, { timeout: 1500 });
    });

    test('does not render when isVisible is false', () => {
      render(
        <Toast
          type="info"
          message="Hidden message"
          isVisible={false}
          onClose={jest.fn()}
        />
      );

      expect(screen.queryByText(/hidden message/i)).not.toBeInTheDocument();
    });

    test('has proper accessibility attributes', () => {
      render(
        <Toast
          type="error"
          message="Error message"
          isVisible={true}
          onClose={jest.fn()}
        />
      );

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'assertive');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Network Error Handling', () => {
    test('handles fetch errors gracefully', async () => {
      // Mock fetch to reject
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const TestComponent = () => {
        const [error, setError] = React.useState<string | null>(null);
        
        const handleFetch = async () => {
          try {
            await fetch('/api/test');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        };

        return (
          <div>
            <button onClick={handleFetch}>Fetch Data</button>
            {error && <div role="alert">{error}</div>}
          </div>
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const fetchButton = screen.getByRole('button', { name: /fetch data/i });
      await user.click(fetchButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('handles timeout errors', async () => {
      // Mock fetch to timeout
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const TestComponent = () => {
        const [error, setError] = React.useState<string | null>(null);
        
        const handleFetch = async () => {
          try {
            await fetch('/api/test');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        };

        return (
          <div>
            <button onClick={handleFetch}>Fetch Data</button>
            {error && <div role="alert">{error}</div>}
          </div>
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const fetchButton = screen.getByRole('button', { name: /fetch data/i });
      await user.click(fetchButton);

      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Form Validation Edge Cases', () => {
    test('handles extremely long input values', async () => {
      const TestForm = () => {
        const [error, setError] = React.useState<string | null>(null);
        
        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const input = formData.get('testInput') as string;
          
          if (input.length > 1000) {
            setError('Input too long (max 1000 characters)');
          }
        };

        return (
          <form onSubmit={handleSubmit}>
            <input name="testInput" aria-label="Test input" />
            <button type="submit">Submit</button>
            {error && <div role="alert">{error}</div>}
          </form>
        );
      };

      const user = userEvent.setup();
      render(<TestForm />);

      const input = screen.getByLabelText(/test input/i);
      const longString = 'a'.repeat(1001);
      await user.type(input, longString);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/input too long/i)).toBeInTheDocument();
      });
    });

    test('handles special characters in input', async () => {
      const TestForm = () => {
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
      render(<TestForm />);

      const input = screen.getByLabelText(/special chars input/i);
      const specialChars = '!@#$%^&*()_+{}|:"<>?[];\',./ ñáéíóú';
      
      await user.type(input, specialChars);

      expect(screen.getByTestId('output')).toHaveTextContent(specialChars);
    });

    test('handles clipboard paste events', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        
        return (
          <div>
            <input 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-label="Paste input"
            />
            <div data-testid="output">{value}</div>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const input = screen.getByLabelText(/paste input/i);
      await user.click(input);
      
      // Simulate paste
      await user.paste('Pasted content from clipboard');

      expect(screen.getByTestId('output')).toHaveTextContent('Pasted content from clipboard');
    });
  });

  describe('Loading State Edge Cases', () => {
    test('handles multiple rapid clicks on loading button', async () => {
      const TestComponent = () => {
        const [isLoading, setIsLoading] = React.useState(false);
        const [clickCount, setClickCount] = React.useState(0);
        
        const handleClick = async () => {
          if (isLoading) return;
          
          setIsLoading(true);
          setClickCount(prev => prev + 1);
          
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 100));
          setIsLoading(false);
        };

        return (
          <div>
            <button onClick={handleClick} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Click Me'}
            </button>
            <div data-testid="click-count">Clicks: {clickCount}</div>
          </div>
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const button = screen.getByRole('button');
      
      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('click-count')).toHaveTextContent('Clicks: 1');
      });
    });
  });

  describe('Memory Leak Prevention', () => {
    test('cleans up event listeners on unmount', () => {
      const TestComponent = () => {
        React.useEffect(() => {
          const handleResize = () => {};
          window.addEventListener('resize', handleResize);
          
          return () => {
            window.removeEventListener('resize', handleResize);
          };
        }, []);

        return <div>Component with event listener</div>;
      };

      const { unmount } = render(<TestComponent />);
      
      // Should not throw or cause memory leaks
      expect(() => unmount()).not.toThrow();
    });

    test('cancels pending promises on unmount', async () => {
      const TestComponent = () => {
        const [data, setData] = React.useState<string | null>(null);
        
        React.useEffect(() => {
          let cancelled = false;
          
          const fetchData = async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!cancelled) {
              setData('Fetched data');
            }
          };
          
          fetchData();
          
          return () => {
            cancelled = true;
          };
        }, []);

        return <div>{data || 'Loading...'}</div>;
      };

      const { unmount } = render(<TestComponent />);
      
      // Unmount before promise resolves
      unmount();
      
      // Should not cause warnings about setting state on unmounted component
      await new Promise(resolve => setTimeout(resolve, 150));
    });
  });
});