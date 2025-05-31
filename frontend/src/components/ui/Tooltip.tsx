import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  icon?: boolean;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  trigger = 'hover',
  icon = false,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800'
  };

  const handleShow = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    } else {
      setIsVisible(!isVisible);
    }
  };

  const handleHide = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsVisible(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        onClick={trigger === 'click' ? handleShow : undefined}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-describedby={isVisible ? 'tooltip' : undefined}
        aria-expanded={isVisible}
        className="inline-flex items-center cursor-help focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
      >
        {children || (icon && <HelpCircle className="h-4 w-4 text-text-secondary hover:text-text-primary transition-colors" />)}
      </div>

      {isVisible && (
        <div
          id="tooltip"
          role="tooltip"
          className={`
            absolute z-50 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg
            max-w-xs break-words animate-in fade-in duration-200
            ${positionClasses[position]}
          `}
        >
          {content}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;