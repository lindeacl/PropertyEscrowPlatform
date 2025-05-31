import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  onClose
}) => {
  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-success-50',
          borderColor: 'border-success-200',
          iconColor: 'text-success-600',
          titleColor: 'text-success-800',
          messageColor: 'text-success-700'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-danger-50',
          borderColor: 'border-danger-200',
          iconColor: 'text-danger-600',
          titleColor: 'text-danger-800',
          messageColor: 'text-danger-700'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-accent-50',
          borderColor: 'border-accent-200',
          iconColor: 'text-accent-600',
          titleColor: 'text-accent-800',
          messageColor: 'text-accent-700'
        };
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-primary-50',
          borderColor: 'border-primary-200',
          iconColor: 'text-primary-600',
          titleColor: 'text-primary-800',
          messageColor: 'text-primary-700'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700'
        };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <div className={`
      flex items-start p-4 rounded-lg border shadow-lg max-w-sm w-full
      ${config.bgColor} ${config.borderColor}
      animate-in slide-in-from-right duration-300
    `}>
      <Icon className={`h-5 w-5 mt-0.5 mr-3 ${config.iconColor}`} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`text-sm font-semibold ${config.titleColor}`}>
            {title}
          </h4>
        )}
        <p className={`text-sm ${title ? 'mt-1' : ''} ${config.messageColor}`}>
          {message}
        </p>
      </div>
      
      <button
        onClick={() => onClose(id)}
        className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;