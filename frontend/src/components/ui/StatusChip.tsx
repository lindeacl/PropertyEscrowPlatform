import React from 'react';

interface StatusChipProps {
  status: 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled';
  children: React.ReactNode;
  className?: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ status, children, className = '' }) => {
  const statusStyles = {
    pending: 'bg-accent/20 text-accent-800 border-accent/30',
    active: 'bg-primary/20 text-primary-800 border-primary/30',
    completed: 'bg-success/20 text-success-800 border-success/30',
    disputed: 'bg-danger/20 text-danger-800 border-danger/30',
    cancelled: 'bg-border text-text-secondary border-border'
  };

  return (
    <span className={`
      inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border
      ${statusStyles[status]}
      ${className}
    `}>
      {children}
    </span>
  );
};

export default StatusChip;