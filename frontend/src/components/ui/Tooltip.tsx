import React, { useState, useRef } from 'react';
import { HelpCircle } from 'lucide-react';
import { ariaUtils, focusRingStyles } from '../../utils/accessibility';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  icon?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  icon = false,
  position = 'top',
  trigger = 'hover',
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const tooltipId = useRef(ariaUtils.generateId('tooltip'));

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const toggleTooltip = () => {
    setIsVisible(!isVisible);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
  };

  const triggerProps = {
    'aria-describedby': isVisible ? tooltipId.current : undefined,
    ...(trigger === 'hover' && {
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
      onFocus: showTooltip,
      onBlur: hideTooltip
    }),
    ...(trigger === 'click' && {
      onClick: toggleTooltip,
      'aria-expanded': isVisible
    }),
    ...(trigger === 'focus' && {
      onFocus: showTooltip,
      onBlur: hideTooltip
    })
  };

  const TriggerElement = () => {
    if (children) {
      return React.cloneElement(children as React.ReactElement, triggerProps);
    }
    
    if (icon) {
      return (
        <button
          type="button"
          className={`
            inline-flex items-center justify-center w-5 h-5 
            text-gray-400 hover:text-gray-600 
            ${focusRingStyles.base} rounded-full
          `}
          aria-label="More information"
          {...triggerProps}
        >
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
        </button>
      );
    }

    return null;
  };

  return (
    <div className="relative inline-block">
      <TriggerElement />
      
      {isVisible && (
        <div
          id={tooltipId.current}
          role="tooltip"
          className={`
            absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md
            shadow-lg max-w-xs whitespace-normal break-words
            ${positionClasses[position]}
          `}
        >
          {content}
          {/* Arrow */}
          <div
            className={`
              absolute w-0 h-0 border-4
              ${arrowClasses[position]}
            `}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;