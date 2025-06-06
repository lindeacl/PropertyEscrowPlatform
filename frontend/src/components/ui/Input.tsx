import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseClasses = 'px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    default: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
    filled: 'border-transparent bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white',
    outlined: 'border-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white'
  };

  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';
  const widthClasses = fullWidth ? 'w-full' : '';
  const paddingClasses = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          </div>
        )}
        <input
          ref={ref}
          className={`${baseClasses} ${variantClasses[variant]} ${errorClasses} ${widthClasses} ${paddingClasses} ${className}`}
          disabled={disabled}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;