import React from 'react';

interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helper?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helper,
  required = false,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-xl border transition-colors duration-200
          bg-surface dark:bg-surface-dark
          text-text-primary dark:text-text-primary-dark
          placeholder-text-secondary dark:placeholder-text-secondary-dark
          ${error 
            ? 'border-danger focus:border-danger focus:ring-danger' 
            : 'border-border dark:border-border-dark focus:border-primary focus:ring-primary'
          }
          focus:outline-none focus:ring-2 focus:ring-opacity-20
          disabled:bg-border/20 disabled:text-text-secondary disabled:cursor-not-allowed
        `}
      />
      {error && (
        <p className="mt-2 text-sm text-danger">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-2 text-sm text-text-secondary dark:text-text-secondary-dark">{helper}</p>
      )}
    </div>
  );
};

export default Input;