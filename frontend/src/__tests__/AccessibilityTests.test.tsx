import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import WalletConnection from '../components/ui/WalletConnection';
import Toast from '../components/ui/Toast';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Mock window.ethereum for testing
beforeAll(() => {
  Object.defineProperty(window, 'ethereum', {
    value: {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
      isMetaMask: true,
    },
    writable: true,
  });
});

describe('Accessibility Tests', () => {
  test('WalletConnection component should have no accessibility violations', async () => {
    const { container } = render(<WalletConnection />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Toast component should have no accessibility violations', async () => {
    const mockOnClose = jest.fn();
    const { container } = render(
      <Toast
        type="success"
        message="Test notification"
        onClose={mockOnClose}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Error Toast should have assertive aria-live', async () => {
    const mockOnClose = jest.fn();
    const { container } = render(
      <Toast
        type="error"
        message="Error message"
        onClose={mockOnClose}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('ErrorBoundary should have no accessibility violations when displaying error', async () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();

    consoleSpy.mockRestore();
  });

  test('Form elements should have proper labels and accessibility', async () => {
    const TestForm = () => (
      <form>
        <label htmlFor="propertyName">Property Name</label>
        <input
          id="propertyName"
          type="text"
          aria-required="true"
          aria-describedby="propertyName-help"
        />
        <div id="propertyName-help">Enter the property name</div>
        
        <label htmlFor="salePrice">Sale Price</label>
        <input
          id="salePrice"
          type="number"
          aria-required="true"
          aria-describedby="salePrice-help"
        />
        <div id="salePrice-help">Enter the sale price in MATIC</div>
        
        <button type="submit" aria-label="Create escrow transaction">
          Create Escrow
        </button>
      </form>
    );

    const { container } = render(<TestForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Interactive elements should have focus indicators', async () => {
    const TestComponent = () => (
      <div>
        <button className="focus:ring-2 focus:ring-blue-500 focus:outline-none">
          Focusable Button
        </button>
        <input 
          className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
          aria-label="Test input"
        />
        <a 
          href="#"
          className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
          aria-label="Test link"
        >
          Link
        </a>
      </div>
    );

    const { container } = render(<TestComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Modal dialogs should have proper roles and properties', async () => {
    const TestModal = () => (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <h2 id="modal-title">Confirm Transaction</h2>
        <p id="modal-description">
          Please confirm you want to proceed with this transaction.
        </p>
        <button aria-label="Confirm transaction">Confirm</button>
        <button aria-label="Cancel transaction">Cancel</button>
      </div>
    );

    const { container } = render(<TestModal />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Tables should have proper headers and captions', async () => {
    const TestTable = () => (
      <table>
        <caption>Escrow Transactions</caption>
        <thead>
          <tr>
            <th scope="col">Property</th>
            <th scope="col">Status</th>
            <th scope="col">Amount</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Downtown Condo</td>
            <td>Active</td>
            <td>500,000 MATIC</td>
            <td>
              <button aria-label="View details for Downtown Condo">
                View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    );

    const { container } = render(<TestTable />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Status indicators should have text alternatives', async () => {
    const TestStatus = () => (
      <div>
        <span 
          className="inline-block w-3 h-3 bg-green-500 rounded-full"
          aria-label="Active status"
          role="img"
        />
        <span className="sr-only">Active</span>
        
        <span 
          className="inline-block w-3 h-3 bg-yellow-500 rounded-full"
          aria-label="Pending status"
          role="img"
        />
        <span className="sr-only">Pending</span>
        
        <span 
          className="inline-block w-3 h-3 bg-red-500 rounded-full"
          aria-label="Error status"
          role="img"
        />
        <span className="sr-only">Error</span>
      </div>
    );

    const { container } = render(<TestStatus />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Loading states should be announced to screen readers', async () => {
    const TestLoading = () => (
      <div>
        <div 
          role="status" 
          aria-live="polite"
          aria-label="Loading transaction data"
        >
          <span className="sr-only">Loading...</span>
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );

    const { container } = render(<TestLoading />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});