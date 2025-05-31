import React from 'react';
import { focusRingStyles, touchTargets } from '../../utils/accessibility';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    disabled:opacity-50 disabled:cursor-not-allowed
    ${focusRingStyles.button}
  `;

  const variantStyles = {
    primary: `
      bg-blue-600 text-white 
      hover:bg-blue-700 active:bg-blue-800
      border border-transparent
    `,
    secondary: `
      bg-gray-600 text-white 
      hover:bg-gray-700 active:bg-gray-800
      border border-transparent
    `,
    outline: `
      bg-transparent text-blue-600 
      hover:bg-blue-50 active:bg-blue-100
      border border-blue-600 hover:border-blue-700
    `,
    ghost: `
      bg-transparent text-gray-700 
      hover:bg-gray-100 active:bg-gray-200
      border border-transparent
    `,
    danger: `
      bg-red-600 text-white 
      hover:bg-red-700 active:bg-red-800
      border border-transparent
    `
  };

  const sizeStyles = {
    sm: `text-sm px-3 py-2 min-h-[${touchTargets.minimum}]`,
    md: `text-base px-4 py-2.5 min-h-[${touchTargets.comfortable}]`,
    lg: `text-lg px-6 py-3 min-h-[${touchTargets.large}]`
  };

  const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={combinedClassName}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {!loading && leftIcon && (
        <span className="mr-2" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      
      <span>
        {loading && loadingText ? loadingText : children}
      </span>
      
      {!loading && rightIcon && (
        <span className="ml-2" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

export default AccessibleButton;