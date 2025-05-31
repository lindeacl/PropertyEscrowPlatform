import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-600 focus:ring-primary-500 active:bg-primary-700',
    secondary: 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white focus:ring-primary-500',
    danger: 'bg-danger text-white hover:bg-danger-600 focus:ring-danger-500 active:bg-danger-700',
    success: 'bg-success text-white hover:bg-success-600 focus:ring-success-500 active:bg-success-700',
    warning: 'bg-accent text-white hover:bg-accent-600 focus:ring-accent-500 active:bg-accent-700'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5'
  };

  const isDisabled = disabled || loading;
  const widthClasses = fullWidth ? 'w-full' : '';

  const renderIcon = (position: 'left' | 'right') => {
    if (loading && position === 'left') {
      return <Loader2 className={`animate-spin ${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}`} />;
    }
    if (icon && iconPosition === position && !loading) {
      return icon;
    }
    return null;
  };

  const buttonText = loading && loadingText ? loadingText : children;

  const classes = `
    ${baseClasses}
    ${isDisabled ? 'bg-border text-text-secondary cursor-not-allowed opacity-50' : variantClasses[variant]}
    ${sizeClasses[size]}
    ${!isDisabled ? 'hover:scale-105' : ''}
    ${widthClasses}
    ${className}
  `;

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={isDisabled}
    >
      {renderIcon('left')}
      {buttonText}
      {renderIcon('right')}
    </button>
  );
};

export default Button;