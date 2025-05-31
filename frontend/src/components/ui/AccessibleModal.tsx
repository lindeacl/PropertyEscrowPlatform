import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { keyboardNavigation, ariaUtils, focusRingStyles } from '../../utils/accessibility';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(ariaUtils.generateId('modal-title'));
  const descriptionId = useRef(ariaUtils.generateId('modal-description'));
  const previousFocus = useRef<HTMLElement | null>(null);

  // Size configurations
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocus.current = document.activeElement as HTMLElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);

      // Setup keyboard navigation
      const cleanupFocusTrap = modalRef.current 
        ? keyboardNavigation.trapFocus(modalRef.current)
        : () => {};
      
      const cleanupEscape = keyboardNavigation.handleEscape(onClose);

      // Announce modal opening to screen readers
      ariaUtils.announce(`Modal opened: ${title}`, 'assertive');

      return () => {
        cleanupFocusTrap();
        cleanupEscape();
        document.body.style.overflow = 'unset';
        
        // Restore focus to previously focused element
        if (previousFocus.current) {
          previousFocus.current.focus();
        }
      };
    }
  }, [isOpen, title, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby={titleId.current}
      aria-describedby={description ? descriptionId.current : undefined}
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          ref={modalRef}
          className={`
            relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl 
            transition-all w-full ${sizeClasses[size]} mx-auto
            ${focusRingStyles.modal}
          `}
          tabIndex={-1}
        >
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3
                  id={titleId.current}
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {title}
                </h3>
              </div>
              
              {showCloseButton && (
                <button
                  type="button"
                  className={`
                    rounded-md bg-white text-gray-400 hover:text-gray-500
                    p-2 ${focusRingStyles.button}
                  `}
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
            
            {description && (
              <p
                id={descriptionId.current}
                className="mt-2 text-sm text-gray-500"
              >
                {description}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibleModal;