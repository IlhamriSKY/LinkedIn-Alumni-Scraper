import React from 'react';
import { CheckCircle, Circle, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const LoginSteps = ({ currentStep, steps, isError = false, className }) => {
  const getStepIcon = (stepIndex) => {
    if (isError && stepIndex === currentStep) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    
    if (stepIndex < currentStep) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    
    if (stepIndex === currentStep) {
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    }
    
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  const getStepNumber = (stepIndex) => {
    if (isError && stepIndex === currentStep) {
      return <XCircle className="h-6 w-6 text-red-500" />;
    }
    
    if (stepIndex < currentStep) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
    
    if (stepIndex === currentStep) {
      return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
    }
    
    return (
      <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{stepIndex + 1}</span>
      </div>
    );
  };

  const getConnectorColor = (stepIndex) => {
    if (stepIndex < currentStep) {
      return "bg-green-500";
    }
    
    return "bg-gray-300 dark:bg-gray-600";
  };

  const getStepTextColor = (stepIndex) => {
    if (isError && stepIndex === currentStep) {
      return "text-red-600 dark:text-red-400";
    }
    
    if (stepIndex < currentStep) {
      return "text-green-600 dark:text-green-400";
    }
    
    if (stepIndex === currentStep) {
      return "text-blue-600 dark:text-blue-400 font-medium";
    }
    
    return "text-gray-500 dark:text-gray-400";
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Horizontal Step Indicators */}
      <div className="flex items-center justify-between relative mb-3">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step Circle */}
            <div className="flex flex-col items-center relative z-10">
              {getStepNumber(index)}
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2">
                <div className={cn("h-full transition-colors duration-300", getConnectorColor(index))}></div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Current Step Text */}
      <div className="text-center">
        <div className={cn("text-sm font-medium", getStepTextColor(currentStep))}>
          {currentStep >= 0 && currentStep < steps.length ? steps[currentStep].title : 'Initializing...'}
        </div>
        {currentStep >= 0 && currentStep < steps.length && steps[currentStep].description && (
          <div className="text-xs text-muted-foreground mt-1">
            {steps[currentStep].description}
          </div>
        )}
      </div>
    </div>
  );
};

export { LoginSteps };
