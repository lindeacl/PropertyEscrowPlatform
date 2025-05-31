import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CopyButtonProps {
  text: string;
  label?: string;
  showText?: boolean;
  truncate?: boolean;
  truncateLength?: number;
  variant?: 'button' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label,
  showText = true,
  truncate = false,
  truncateLength = 6,
  variant = 'button',
  size = 'md',
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label ? `${label} copied to clipboard` : 'Copied to clipboard');
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatText = (text: string) => {
    if (!truncate) return text;
    
    if (text.length <= truncateLength * 2) return text;
    
    return `${text.slice(0, truncateLength)}...${text.slice(-truncateLength)}`;
  };

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        {showText && (
          <span className="font-mono text-sm text-text-primary">
            {formatText(text)}
          </span>
        )}
        <button
          onClick={handleCopy}
          className="p-1 text-text-secondary hover:text-text-primary transition-colors"
          title={`Copy ${label || 'text'}`}
        >
          {copied ? (
            <Check className={`${sizeClasses[size]} text-success`} />
          ) : (
            <Copy className={sizeClasses[size]} />
          )}
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border
        bg-background hover:bg-gray-50 transition-colors
        text-sm text-text-primary
        ${className}
      `}
      title={`Copy ${label || 'text'}`}
    >
      {showText && (
        <span className="font-mono">
          {formatText(text)}
        </span>
      )}
      {copied ? (
        <Check className={`${sizeClasses[size]} text-success`} />
      ) : (
        <Copy className={sizeClasses[size]} />
      )}
    </button>
  );
};

export default CopyButton;