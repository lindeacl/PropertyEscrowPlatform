import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DemoModeProps {
  children: React.ReactNode;
}

const DemoMode: React.FC<DemoModeProps> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = React.useState(true);
  
  return (
    <div className="relative">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Demo Mode - Frontend Interface Preview
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Browse the platform interface. Blockchain features require wallet connection.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDemoMode(false)}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 text-sm underline"
            >
              Hide Banner
            </button>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
};

export default DemoMode;