import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'compact' | 'numbered';
  showConnector?: boolean;
  className?: string;
}

const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  variant = 'default',
  showConnector = true,
  className = ''
}) => {
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepClasses = (status: string) => {
    const baseClasses = 'flex items-center justify-center rounded-full border-2 transition-all duration-200';
    const sizeClasses = variant === 'compact' ? 'w-6 h-6' : 'w-8 h-8';
    
    switch (status) {
      case 'completed':
        return `${baseClasses} ${sizeClasses} bg-blue-600 border-blue-600 text-white`;
      case 'current':
        return `${baseClasses} ${sizeClasses} bg-blue-50 border-blue-600 text-blue-600 dark:bg-blue-900/20`;
      default:
        return `${baseClasses} ${sizeClasses} bg-gray-50 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600`;
    }
  };

  const getTextClasses = (status: string) => {
    switch (status) {
      case 'completed':
      case 'current':
        return 'text-gray-900 dark:text-white';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const renderStepContent = (step: Step, index: number, status: string) => {
    const isCompact = variant === 'compact';
    
    return (
      <div className={`flex ${orientation === 'vertical' ? 'flex-row' : 'flex-col'} items-center`}>
        <div className={getStepClasses(status)}>
          {status === 'completed' ? (
            <CheckCircle className={isCompact ? 'h-3 w-3' : 'h-4 w-4'} />
          ) : variant === 'numbered' ? (
            <span className={`font-medium ${isCompact ? 'text-xs' : 'text-sm'}`}>
              {index + 1}
            </span>
          ) : step.icon ? (
            <div className={isCompact ? 'text-xs' : 'text-sm'}>
              {step.icon}
            </div>
          ) : (
            <Circle className={isCompact ? 'h-3 w-3' : 'h-4 w-4'} />
          )}
        </div>
        
        {!isCompact && (
          <div className={`${orientation === 'vertical' ? 'ml-3' : 'mt-2'} text-center`}>
            <div className={`font-medium text-sm ${getTextClasses(status)}`}>
              {step.title}
            </div>
            {step.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {step.description}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderConnector = (index: number) => {
    if (!showConnector || index === steps.length - 1) return null;
    
    const isCompleted = index < currentStep;
    const connectorClasses = isCompleted 
      ? 'bg-blue-600' 
      : 'bg-gray-300 dark:bg-gray-600';
    
    if (orientation === 'vertical') {
      return (
        <div className="flex justify-center">
          <div className={`w-0.5 h-8 ${connectorClasses} transition-colors duration-200`} />
        </div>
      );
    }
    
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className={`h-0.5 w-full ${connectorClasses} transition-colors duration-200`} />
      </div>
    );
  };

  if (orientation === 'vertical') {
    return (
      <div className={`space-y-1 ${className}`}>
        {steps.map((step, index) => (
          <div key={step.id}>
            {renderStepContent(step, index, getStepStatus(index))}
            {renderConnector(index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            {renderStepContent(step, index, getStepStatus(index))}
          </div>
          {renderConnector(index)}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stepper;