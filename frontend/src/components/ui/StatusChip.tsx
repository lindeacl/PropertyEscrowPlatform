import React from 'react';
import { CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';

interface StatusChipProps {
  status: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled' | 'funded' | 'verified' | 'released';
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'default' | 'solid' | 'outline';
}

const StatusChip: React.FC<StatusChipProps> = ({ 
  status, 
  children, 
  size = 'md', 
  showIcon = true,
  variant = 'default'
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium transition-colors';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: Clock,
        label: 'Pending',
        colors: {
          default: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
          solid: 'bg-yellow-500 text-white',
          outline: 'border border-yellow-500 text-yellow-600 bg-transparent dark:text-yellow-400'
        }
      },
      active: {
        icon: Clock,
        label: 'Active',
        colors: {
          default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
          solid: 'bg-blue-500 text-white',
          outline: 'border border-blue-500 text-blue-600 bg-transparent dark:text-blue-400'
        }
      },
      funded: {
        icon: CheckCircle,
        label: 'Funded',
        colors: {
          default: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
          solid: 'bg-purple-500 text-white',
          outline: 'border border-purple-500 text-purple-600 bg-transparent dark:text-purple-400'
        }
      },
      verified: {
        icon: CheckCircle,
        label: 'Verified',
        colors: {
          default: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
          solid: 'bg-indigo-500 text-white',
          outline: 'border border-indigo-500 text-indigo-600 bg-transparent dark:text-indigo-400'
        }
      },
      completed: {
        icon: CheckCircle,
        label: 'Completed',
        colors: {
          default: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
          solid: 'bg-green-500 text-white',
          outline: 'border border-green-500 text-green-600 bg-transparent dark:text-green-400'
        }
      },
      released: {
        icon: CheckCircle,
        label: 'Released',
        colors: {
          default: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
          solid: 'bg-emerald-500 text-white',
          outline: 'border border-emerald-500 text-emerald-600 bg-transparent dark:text-emerald-400'
        }
      },
      disputed: {
        icon: AlertTriangle,
        label: 'Disputed',
        colors: {
          default: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
          solid: 'bg-red-500 text-white',
          outline: 'border border-red-500 text-red-600 bg-transparent dark:text-red-400'
        }
      },
      cancelled: {
        icon: X,
        label: 'Cancelled',
        colors: {
          default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
          solid: 'bg-gray-500 text-white',
          outline: 'border border-gray-500 text-gray-600 bg-transparent dark:text-gray-400'
        }
      }
    };

    return configs[status as keyof typeof configs] || configs.pending;
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const displayText = children || config.label;

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${config.colors[variant]}`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      {displayText}
    </span>
  );
};

export default StatusChip;