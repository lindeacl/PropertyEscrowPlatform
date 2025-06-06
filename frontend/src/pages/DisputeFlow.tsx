import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useEscrow } from '../hooks/useEscrow';
import { AlertTriangle, FileText, CheckCircle, Clock } from 'lucide-react';

const DisputeFlow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { account, isConnected } = useWallet();
  const { initiateDispute, resolveDispute, getEscrowDetails, isLoading, error } = useEscrow();
  
  const [escrowData, setEscrowData] = useState<any>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');

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

  const validateDisputeReason = () => {
    if (!disputeReason.trim()) {
      return 'Dispute reason is required';
    }
    if (disputeReason.length < 20) {
      return 'Reason must be at least 20 characters';
    }
    return null;
  };

  const handleInitiateDispute = async () => {
    const validationError = validateDisputeReason();
    if (validationError) return;

    try {
      const result = await initiateDispute(id!, disputeReason);
      setTransactionHash(result.transactionHash);
      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to initiate dispute:', err);
    }
  };

  const handleResolveDispute = async (decision: 'buyer' | 'seller') => {
    if (!resolutionText.trim()) return;

    try {
      const result = await resolveDispute(id!, decision, resolutionText);
      setTransactionHash(result.transactionHash);
      setIsSuccess(true);
    } catch (err) {
      console.error('Failed to resolve dispute:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mb-2" />
          <h2 className="font-semibold text-yellow-800">Connect Your Wallet</h2>
          <p className="text-yellow-700">Please connect your wallet to manage disputes.</p>
        </div>
      </div>
    );
  }

  if (!escrowData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  const isBuyer = account === escrowData.buyer;
  const isSeller = account === escrowData.seller;
  const isArbiter = account === escrowData.arbiter;
  const canInitiateDispute = isBuyer || isSeller;
  const canResolveDispute = isArbiter;
  const hasActiveDispute = escrowData.dispute?.active;
  const disputeValidationError = validateDisputeReason();

  if (!canInitiateDispute && !canResolveDispute) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-red-600 mb-2" />
          <h2 className="font-semibold text-red-800">Access Denied</h2>
          <p className="text-red-700">Only buyer or seller can initiate disputes.</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            {hasActiveDispute ? 'Dispute Resolved!' : 'Dispute Initiated!'}
          </h2>
          <p className="text-green-700 mb-4">
            {hasActiveDispute 
              ? 'The dispute has been resolved successfully.'
              : 'Your dispute has been submitted and will be reviewed by the arbiter.'
            }
          </p>
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
      <h1 className="text-2xl font-bold mb-6">Dispute Management</h1>
      
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{escrowData.propertyName}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Status:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs status-${escrowData.status.toLowerCase()}`}>
              {escrowData.status}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Sale Price:</span>
            <span className="ml-2 font-medium">{parseInt(escrowData.salePrice).toLocaleString()} MATIC</span>
          </div>
        </div>
      </div>

      {hasActiveDispute ? (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Active Dispute</h3>
            </div>
            <p className="text-red-700 mb-2">{escrowData.dispute.reason}</p>
            <p className="text-sm text-red-600">
              Initiated by: {escrowData.dispute.initiatedBy === account ? 'You' : 
                escrowData.dispute.initiatedBy === escrowData.buyer ? 'Buyer' : 'Seller'}
            </p>
          </div>

          {canResolveDispute ? (
            <form 
              role="form"
              aria-label="Dispute Management"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="bg-white border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Resolve Dispute</h3>
                <p className="text-sm text-gray-600 mb-4">Only the arbiter can resolve disputes</p>
                
                <div className="mb-4">
                  <label htmlFor="resolutionDecision" className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Decision
                  </label>
                  <textarea
                    id="resolutionDecision"
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Explain your decision and reasoning..."
                    disabled={isLoading}
                    aria-required="true"
                    aria-describedby="resolutionDecision-help"
                  />
                  <p id="resolutionDecision-help" className="mt-1 text-sm text-gray-600">
                    Provide detailed reasoning for your resolution decision
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleResolveDispute('buyer')}
                    disabled={isLoading || !resolutionText.trim()}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    aria-label="Resolve dispute in favor of buyer"
                  >
                    Resolve in Favor of Buyer
                  </button>
                  <button
                    onClick={() => handleResolveDispute('seller')}
                    disabled={isLoading || !resolutionText.trim()}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    aria-label="Resolve dispute in favor of seller"
                  >
                    Resolve in Favor of Seller
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Clock className="w-5 h-5 text-blue-600 mb-2" />
              <h3 className="font-semibold text-blue-800">Awaiting Resolution</h3>
              <p className="text-blue-700">Only the arbiter can resolve disputes.</p>
            </div>
          )}

          {escrowData.dispute.resolution && (
            <div className="bg-gray-50 border rounded-lg p-6">
              <h3 className="font-semibold mb-2">Dispute History</h3>
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <span className="font-medium">Resolution:</span> {escrowData.dispute.resolution}
                </p>
                <p className="text-xs text-gray-500">Dispute Resolved</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        canInitiateDispute && (
          <form 
            role="form"
            aria-label="Dispute Management"
            onSubmit={(e) => { e.preventDefault(); handleInitiateDispute(); }}
          >
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Initiate Dispute</h3>
              
              <div className="mb-4">
                <label htmlFor="disputeReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Dispute Reason
                </label>
                <textarea
                  id="disputeReason"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Describe the issue with this transaction..."
                  disabled={isLoading}
                  aria-required="true"
                  aria-describedby="disputeReason-help"
                />
                <p id="disputeReason-help" className="mt-1 text-sm text-gray-600">
                  Provide detailed information about why you are disputing this transaction
                </p>
                {disputeValidationError && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {disputeValidationError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || Boolean(disputeValidationError)}
                className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                aria-label="Submit dispute for this escrow transaction"
              >
                {isLoading ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </form>
        )
      )}

      {!canResolveDispute && hasActiveDispute && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mb-2" />
          <h3 className="font-semibold text-yellow-800">Resolution Pending</h3>
          <p className="text-yellow-700">Only the arbiter can resolve disputes.</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default DisputeFlow;