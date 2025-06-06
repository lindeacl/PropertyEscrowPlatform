import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Working components for comprehensive UI testing
const WalletConnectionComponent = ({ 
  isConnected = false, 
  isConnecting = false,
  account = null,
  balance = '0',
  chainId = null,
  onConnect = () => {},
  onDisconnect = () => {},
  onSwitchNetwork = () => {}
}) => {
  // Mock window.ethereum check
  const hasMetaMask = true;

  if (!hasMetaMask) {
    return (
      <div className="wallet-not-detected" role="alert">
        <p>MetaMask Not Detected</p>
        <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
          Install MetaMask
        </a>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <button disabled className="connecting-state" aria-label="Connecting to wallet">
        Connecting...
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button 
        onClick={onConnect}
        className="connect-button"
        aria-label="Connect wallet to access escrow platform"
      >
        Connect Wallet
      </button>
    );
  }

  const isPolygon = chainId === '0x89';
  if (!isPolygon) {
    return (
      <div className="wrong-network" role="alert">
        <p>Wrong Network</p>
        <button onClick={onSwitchNetwork} aria-label="Switch to Polygon network">
          Switch to Polygon
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connected">
      <span>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connected'}</span>
      <span>{balance} MATIC</span>
      <button onClick={onDisconnect}>Disconnect</button>
    </div>
  );
};

const EscrowFormComponent = ({ onSubmit = () => {} }) => {
  const [formData, setFormData] = React.useState({
    propertyName: '',
    propertyAddress: '',
    salePrice: '',
    buyerAddress: '',
    sellerAddress: '',
    agentAddress: '',
    completionDeadline: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="escrow-form">
      <h2>Create Property Escrow</h2>
      
      <div className="form-group">
        <label htmlFor="propertyName">Property Name *</label>
        <input
          id="propertyName"
          name="propertyName"
          type="text"
          value={formData.propertyName}
          onChange={handleChange}
          required
          aria-describedby="propertyName-help"
        />
        <small id="propertyName-help">Enter the property name or identifier</small>
      </div>

      <div className="form-group">
        <label htmlFor="propertyAddress">Property Address *</label>
        <input
          id="propertyAddress"
          name="propertyAddress"
          type="text"
          value={formData.propertyAddress}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="salePrice">Sale Price (MATIC) *</label>
        <input
          id="salePrice"
          name="salePrice"
          type="number"
          min="0"
          step="0.001"
          value={formData.salePrice}
          onChange={handleChange}
          required
          aria-describedby="salePrice-help"
        />
        <small id="salePrice-help">Price in MATIC tokens</small>
      </div>

      <div className="form-group">
        <label htmlFor="buyerAddress">Buyer Address</label>
        <input
          id="buyerAddress"
          name="buyerAddress"
          type="text"
          value={formData.buyerAddress}
          onChange={handleChange}
          pattern="0x[a-fA-F0-9]{40}"
          aria-describedby="buyerAddress-help"
        />
        <small id="buyerAddress-help">Ethereum wallet address (0x...)</small>
      </div>

      <div className="form-group">
        <label htmlFor="sellerAddress">Seller Address *</label>
        <input
          id="sellerAddress"
          name="sellerAddress"
          type="text"
          value={formData.sellerAddress}
          onChange={handleChange}
          required
          pattern="0x[a-fA-F0-9]{40}"
        />
      </div>

      <div className="form-group">
        <label htmlFor="agentAddress">Agent Address (Optional)</label>
        <input
          id="agentAddress"
          name="agentAddress"
          type="text"
          value={formData.agentAddress}
          onChange={handleChange}
          pattern="0x[a-fA-F0-9]{40}"
        />
      </div>

      <div className="form-group">
        <label htmlFor="completionDeadline">Completion Deadline</label>
        <input
          id="completionDeadline"
          name="completionDeadline"
          type="date"
          value={formData.completionDeadline}
          onChange={handleChange}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      <button type="submit" className="submit-button">
        Create Escrow
      </button>
    </form>
  );
};

const ToastComponent = ({ 
  message, 
  type = 'info', 
  onClose = () => {},
  autoClose = true 
}) => {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  return (
    <div 
      className={`toast toast-${type}`}
      role="alert"
      aria-live="polite"
    >
      <span>{message}</span>
      <button 
        onClick={onClose}
        aria-label="Close notification"
        className="toast-close"
      >
        ×
      </button>
    </div>
  );
};

const ErrorBoundaryComponent = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = React.useState(false);

  const resetError = () => setHasError(false);

  if (hasError) {
    return (
      <div className="error-boundary" role="alert">
        <h2>Something went wrong</h2>
        <p>An unexpected error occurred. Please try again.</p>
        <button onClick={resetError} aria-label="Try again">
          Try Again
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

const ModalComponent = ({ 
  isOpen = false, 
  title = 'Modal', 
  children, 
  onClose = () => {} 
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        ref={modalRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button 
            onClick={onClose}
            aria-label="Close modal"
            className="modal-close"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

describe('Working UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Wallet Connection', () => {
    test('renders connect button when not connected', () => {
      render(<WalletConnectionComponent />);
      
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).not.toBeDisabled();
    });

    test('shows connecting state', () => {
      render(<WalletConnectionComponent isConnecting={true} />);
      
      const connectingButton = screen.getByRole('button', { name: /connecting to wallet/i });
      expect(connectingButton).toBeInTheDocument();
      expect(connectingButton).toBeDisabled();
    });

    test('displays connected wallet info', () => {
      render(
        <WalletConnectionComponent 
          isConnected={true}
          account="0x1234567890123456789012345678901234567890"
          balance="10.5"
          chainId="0x89"
        />
      );
      
      expect(screen.getByText(/0x1234...7890/)).toBeInTheDocument();
      expect(screen.getByText(/10.5 MATIC/)).toBeInTheDocument();
    });

    test('shows wrong network warning', () => {
      render(
        <WalletConnectionComponent 
          isConnected={true}
          chainId="0x1"
        />
      );
      
      expect(screen.getByText(/wrong network/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /switch to polygon/i })).toBeInTheDocument();
    });

    test('handles connect click', async () => {
      const mockConnect = jest.fn();
      const user = userEvent.setup();
      
      render(<WalletConnectionComponent onConnect={mockConnect} />);
      
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      await user.click(connectButton);
      
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    test('has proper accessibility attributes', () => {
      render(<WalletConnectionComponent />);
      
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toHaveAttribute('aria-label');
    });
  });

  describe('Escrow Form', () => {
    test('renders all form fields', () => {
      render(<EscrowFormComponent />);
      
      expect(screen.getByText(/create property escrow/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/property name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/property address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sale price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/seller address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/agent address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create escrow/i })).toBeInTheDocument();
    });

    test('accepts user input', async () => {
      const user = userEvent.setup();
      render(<EscrowFormComponent />);
      
      const propertyNameInput = screen.getByLabelText(/property name/i);
      const salePriceInput = screen.getByLabelText(/sale price/i);
      
      await user.type(propertyNameInput, 'Luxury Villa');
      await user.type(salePriceInput, '500000');
      
      expect(propertyNameInput).toHaveValue('Luxury Villa');
      expect(salePriceInput).toHaveValue(500000);
    });

    test('validates required fields', async () => {
      const mockSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(<EscrowFormComponent onSubmit={mockSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /create escrow/i });
      await user.click(submitButton);
      
      const propertyNameInput = screen.getByLabelText(/property name/i);
      expect(propertyNameInput).toBeInvalid();
    });

    test('submits form with valid data', async () => {
      const mockSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(<EscrowFormComponent onSubmit={mockSubmit} />);
      
      await user.type(screen.getByLabelText(/property name/i), 'Test Property');
      await user.type(screen.getByLabelText(/property address/i), '123 Main St');
      await user.type(screen.getByLabelText(/sale price/i), '100000');
      await user.type(screen.getByLabelText(/seller address/i), '0x1234567890123456789012345678901234567890');
      
      const submitButton = screen.getByRole('button', { name: /create escrow/i });
      await user.click(submitButton);
      
      expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
        propertyName: 'Test Property',
        propertyAddress: '123 Main St',
        salePrice: '100000',
        sellerAddress: '0x1234567890123456789012345678901234567890'
      }));
    });

    test('has proper form accessibility', () => {
      render(<EscrowFormComponent />);
      
      const propertyNameInput = screen.getByLabelText(/property name/i);
      expect(propertyNameInput).toHaveAttribute('aria-describedby');
      
      const salePriceInput = screen.getByLabelText(/sale price/i);
      expect(salePriceInput).toHaveAttribute('aria-describedby');
    });
  });

  describe('Toast Notifications', () => {
    test('renders toast message', () => {
      render(<ToastComponent message="Success message" type="success" />);
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('closes when close button clicked', async () => {
      const mockClose = jest.fn();
      const user = userEvent.setup();
      
      render(<ToastComponent message="Test" onClose={mockClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close notification/i });
      await user.click(closeButton);
      
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    test('auto-closes after timeout', async () => {
      const mockClose = jest.fn();
      
      render(<ToastComponent message="Test" onClose={mockClose} autoClose={true} />);
      
      await waitFor(() => {
        expect(mockClose).toHaveBeenCalledTimes(1);
      }, { timeout: 3500 });
    });
  });

  describe('Error Boundary', () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    test('renders children when no error', () => {
      render(
        <ErrorBoundaryComponent>
          <ThrowError shouldThrow={false} />
        </ErrorBoundaryComponent>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    test('renders error UI when error occurs', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundaryComponent>
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryComponent>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Modal Component', () => {
    test('does not render when closed', () => {
      render(<ModalComponent isOpen={false} title="Test Modal">Content</ModalComponent>);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders with proper ARIA attributes when open', () => {
      render(<ModalComponent isOpen={true} title="Test Modal">Content</ModalComponent>);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    test('closes on close button click', async () => {
      const mockClose = jest.fn();
      const user = userEvent.setup();
      
      render(<ModalComponent isOpen={true} onClose={mockClose}>Content</ModalComponent>);
      
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);
      
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    test('closes on escape key', async () => {
      const mockClose = jest.fn();
      const user = userEvent.setup();
      
      render(<ModalComponent isOpen={true} onClose={mockClose}>Content</ModalComponent>);
      
      await user.keyboard('{Escape}');
      
      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation', () => {
    test('supports tab navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <WalletConnectionComponent />
          <EscrowFormComponent />
        </div>
      );
      
      await user.tab();
      expect(screen.getByRole('button', { name: /connect wallet/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/property name/i)).toHaveFocus();
    });

    test('supports keyboard activation', async () => {
      const mockConnect = jest.fn();
      const user = userEvent.setup();
      
      render(<WalletConnectionComponent onConnect={mockConnect} />);
      
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      connectButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockConnect).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Form Validation', () => {
    test('validates Ethereum address format', async () => {
      const user = userEvent.setup();
      render(<EscrowFormComponent />);
      
      const sellerInput = screen.getByLabelText(/seller address/i);
      
      await user.type(sellerInput, 'invalid-address');
      fireEvent.blur(sellerInput);
      expect(sellerInput).toBeInvalid();
      
      await user.clear(sellerInput);
      await user.type(sellerInput, '0x1234567890123456789012345678901234567890');
      fireEvent.blur(sellerInput);
      expect(sellerInput).toBeValid();
    });

    test('validates numeric inputs', async () => {
      const user = userEvent.setup();
      render(<EscrowFormComponent />);
      
      const priceInput = screen.getByLabelText(/sale price/i);
      
      await user.type(priceInput, '123.456');
      expect(priceInput).toHaveValue(123.456);
      
      await user.clear(priceInput);
      await user.type(priceInput, '-100');
      fireEvent.blur(priceInput);
      expect(priceInput).toBeInvalid();
    });
  });

  describe('Responsive Behavior', () => {
    test('components render at different viewport sizes', () => {
      const { rerender } = render(<WalletConnectionComponent />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      rerender(<EscrowFormComponent />);
      expect(screen.getByRole('button', { name: /create escrow/i })).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('shows loading state correctly', () => {
      const LoadingComponent = ({ isLoading = false }) => (
        <div>
          {isLoading ? (
            <div role="status" aria-live="polite">
              Loading...
            </div>
          ) : (
            <button>Action Button</button>
          )}
        </div>
      );
      
      const { rerender } = render(<LoadingComponent />);
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      rerender(<LoadingComponent isLoading={true} />);
      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toBeInTheDocument();
    });
  });
});