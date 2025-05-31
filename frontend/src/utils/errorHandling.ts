export const handleBlockchainError = (error: any): string => {
  if (error.code === 4001) {
    return 'Transaction rejected by user';
  }
  
  if (error.code === -32002) {
    return 'Request already pending in MetaMask';
  }
  
  if (error.code === -32603) {
    return 'Internal JSON-RPC error. Please check your network connection';
  }
  
  if (error.message?.includes('JSON')) {
    return 'Network connection error. Please ensure your local blockchain is running';
  }
  
  if (error.message?.includes('gas')) {
    return 'Transaction failed due to insufficient gas';
  }
  
  return error.message || 'An unexpected error occurred';
};