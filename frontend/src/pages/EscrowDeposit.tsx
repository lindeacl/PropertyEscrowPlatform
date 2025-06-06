import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useEscrow } from '../hooks/useEscrow';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

const EscrowDeposit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { account, isConnected, balance } = useWallet();
  const { depositFunds, getEscrowDetails, isLoading, error } = useEscrow();
  
  const [escrowData, setEscrowData] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadEscrowDetails();
    }
  }, [id]);

  const loadEscrowDetails = async () => {
    try {
      const details = await getEscrowDetails(id!);
      setEscrowData(details);
    } catch (err) {
      console.error('Failed to load escrow details:', err);
    }
  };

  const validateDeposit = () => {
    const amount = parseFloat(depositAmount);
    const walletBalance = parseFloat(balance);
    
    if (amount <= 0) {
      return 'Deposit amount must be positive';
    }
    
    if (amount > walletBalance) {
      return 'Insufficient wallet balance';
    }
    
    return null;
  };

  const handleDeposit = async () => {
    const validationError = validateDeposit();
    if (validationError) {
      return;
    }

    setShowConfirmation(true);
  };

  const confirmDeposit = async () => {
    try {
      const result = await depositFunds(id!, depositAmount);
      setTransactionHash(result.transactionHash);
      setIsSuccess(true);
      setShowConfirmation(false);
    } catch (err) {
      console.error('Deposit failed:', err);
      setShowConfirmation(false);
    }
  };

  const isBuyer = account === escrowData?.buyer;
  const validationError = validateDeposit();

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-yellow-600 mb-2" />
          <h2 className="font-semibold text-yellow-800">Connect Your Wallet</h2>
          <p className="text-yellow-700">Please connect your wallet to deposit funds.</p>
        </div>
      </div>
    );
  }

  if (!isBuyer) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-600 mb-2" />
          <h2 className="font-semibold text-red-800">Access Denied</h2>
          <p className="text-red-700">Only the buyer can deposit funds to this escrow.</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-800 mb-2">Deposit Successful!</h2>
          <p className="text-green-700 mb-4">Your funds have been deposited to the escrow.</p>
          <div className="bg-white p-3 rounded border">
            <p className="text-sm text-gray-600">Transaction Hash:</p>
            <p className="font-mono text-sm break-all">{transactionHash}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Deposit Funds to Escrow</h1>
      
      {escrowData && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{escrowData.propertyName}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Sale Price:</span>
              <span className="ml-2 font-medium">{parseInt(escrowData.salePrice).toLocaleString()} MATIC</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs status-${escrowData.status.toLowerCase()}`}>
                {escrowData.status}
              </span>
            </div>
          </div>
        </div>
      )}

      <form 
        role="form"
        aria-label="Deposit Funds to Escrow"
        onSubmit={(e) => { e.preventDefault(); handleDeposit(); }}
      >
        <div className="mb-6">
          <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-2">
            Deposit Amount (MATIC)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              id="depositAmount"
              type="number"
              step="0.001"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              disabled={isLoading}
              aria-required="true"
              aria-describedby="depositAmount-help"
            />
          </div>
          <p id="depositAmount-help" className="mt-1 text-sm text-gray-600">
            Available balance: {balance} MATIC
          </p>
          {validationError && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {validationError}
            </p>
          )}
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Transaction Details</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Deposit Amount:</span>
              <span>{depositAmount || '0'} MATIC</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Gas Fee:</span>
              <span>~0.002 MATIC</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !depositAmount || Boolean(validationError)}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          aria-label="Deposit funds to escrow account"
        >
          {isLoading ? 'Processing...' : 'Deposit Funds'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Transaction</h3>
            <p className="text-gray-600 mb-4">
              You are about to deposit {depositAmount} MATIC to this escrow.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDeposit}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                aria-label="Confirm deposit transaction"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
                aria-label="Cancel deposit transaction"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscrowDeposit;