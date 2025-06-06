/**
 * Accessibility utilities for PropertyEscrow platform
 * Provides ARIA labels, keyboard navigation, and screen reader support
 */

export const focusRingStyles = {
  base: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  inset: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
  visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
  button: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-opacity-50',
  modal: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
};

export const touchTargets = {
  minimum: 'min-h-[44px] min-w-[44px]', // 44px minimum for touch
  comfortable: 'min-h-[48px] min-w-[48px]', // More comfortable size
  large: 'min-h-[56px] min-w-[56px]' // Large touch targets
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export const ariaUtils = {
  describedBy: (id: string) => ({ 'aria-describedby': id }),
  labelledBy: (id: string) => ({ 'aria-labelledby': id }),
  expanded: (expanded: boolean) => ({ 'aria-expanded': expanded }),
  selected: (selected: boolean) => ({ 'aria-selected': selected }),
  pressed: (pressed: boolean) => ({ 'aria-pressed': pressed }),
  hidden: (hidden: boolean) => ({ 'aria-hidden': hidden }),
  generateId: (prefix: string) => `${prefix}-${Math.random().toString(36).substr(2, 9)}`,
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }
};

export const keyboardNavigation = {
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  },
  
  handleEscape: (onEscape: () => void) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }
};

export const accessibilityLabels = {
  // Navigation
  mainNavigation: 'Main navigation',
  skipToContent: 'Skip to main content',
  walletMenu: 'Wallet connection menu',
  
  // Form labels
  propertyName: 'Property name for escrow transaction',
  buyerAddress: 'Ethereum address of property buyer',
  sellerAddress: 'Ethereum address of property seller',
  agentAddress: 'Ethereum address of real estate agent',
  arbiterAddress: 'Ethereum address of dispute arbiter',
  escrowAmount: 'Escrow amount in ETH or tokens',
  tokenAddress: 'Smart contract address of payment token',
  deadline: 'Escrow deadline date and time',
  propertyDescription: 'Detailed description of property',
  
  // Buttons
  createEscrow: 'Create new property escrow transaction',
  depositFunds: 'Deposit funds into escrow',
  approveFunds: 'Approve funds for release',
  releaseFunds: 'Release escrowed funds to seller',
  cancelEscrow: 'Cancel escrow transaction',
  connectWallet: 'Connect MetaMask or Web3 wallet',
  disconnectWallet: 'Disconnect current wallet',
  
  // Status indicators
  escrowPending: 'Escrow status: Pending deposit',
  escrowFunded: 'Escrow status: Funded and active',
  escrowCompleted: 'Escrow status: Successfully completed',
  escrowCancelled: 'Escrow status: Cancelled',
  escrowDisputed: 'Escrow status: Under dispute',
  
  // Error messages
  walletNotConnected: 'Wallet not connected. Please connect your Web3 wallet to continue.',
  insufficientBalance: 'Insufficient balance for this transaction',
  invalidAddress: 'Invalid Ethereum address format',
  transactionFailed: 'Transaction failed. Please try again.',
  
  // Loading states
  loadingTransaction: 'Processing blockchain transaction...',
  loadingEscrows: 'Loading your escrow transactions...',
  connectingWallet: 'Connecting to your Web3 wallet...',
};

/**
 * Generates accessible button props
 */
export const getButtonProps = (
  label: string,
  onClick: () => void,
  disabled: boolean = false,
  variant: 'primary' | 'secondary' | 'danger' = 'primary'
) => ({
  'aria-label': label,
  'aria-disabled': disabled,
  onClick: disabled ? undefined : onClick,
  role: 'button',
  tabIndex: disabled ? -1 : 0,
  className: `btn btn-${variant} ${disabled ? 'btn-disabled' : ''}`,
});

/**
 * Generates accessible form field props
 */
export const getFieldProps = (
  id: string,
  label: string,
  required: boolean = false,
  error?: string
) => ({
  id,
  'aria-label': label,
  'aria-required': required,
  'aria-invalid': !!error,
  'aria-describedby': error ? `${id}-error` : undefined,
});

/**
 * Generates accessible modal props
 */
export const getModalProps = (title: string, onClose: () => void) => ({
  role: 'dialog',
  'aria-modal': true,
  'aria-labelledby': `modal-title`,
  'aria-describedby': `modal-content`,
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  },
});

/**
 * Focus management for modals and overlays
 */
export class FocusManager {
  private previousFocus: HTMLElement | null = null;
  
  trapFocus(container: HTMLElement) {
    this.previousFocus = document.activeElement as HTMLElement;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (firstElement) {
      firstElement.focus();
    }
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
      if (this.previousFocus) {
        this.previousFocus.focus();
      }
    };
  }
}

/**
 * Screen reader announcements
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Keyboard navigation helpers
 */
export const handleKeyboardNavigation = (
  e: KeyboardEvent,
  onEnter: () => void,
  onEscape?: () => void
) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      onEnter();
      break;
    case 'Escape':
      if (onEscape) {
        e.preventDefault();
        onEscape();
      }
      break;
  }
};