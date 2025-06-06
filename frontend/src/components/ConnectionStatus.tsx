import React, { useEffect, useState } from 'react';
import { initializeBlockchainConnection } from '../utils/blockchainConnection';

interface ConnectionStatusProps {
  children: React.ReactNode;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupConnection = async () => {
      try {
        const connection = await initializeBlockchainConnection();
        setIsConnected(connection.isConnected);
        setError(null);
      } catch (err) {
        console.warn('Blockchain connection unavailable:', err);
        setError('Blockchain connection unavailable - running in offline mode');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    setupConnection();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!isConnected && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {error || 'Blockchain connection not available. Some features may be limited.'}
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};