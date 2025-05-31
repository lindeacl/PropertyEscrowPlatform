import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  DollarSign,
  Users,
  FileText,
  ExternalLink,
  Upload,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EscrowData, EscrowStatus, UserRole } from '../types';

const EscrowDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, address, signer } = useWallet();
  const [escrow, setEscrow] = useState<EscrowData | null>(null);
  const [userRole, setUserRole] = useState<UserRole>({
    isBuyer: false,
    isSeller: false,
    isAgent: false,
    isArbiter: false
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isConnected && id) {
      loadEscrowDetails();
    }
  }, [isConnected, id, address]);

  const loadEscrowDetails = async () => {
    try {
      setLoading(true);
      // This will load real escrow data once contracts are deployed
      // For now, show placeholder state
      setEscrow(null);
      
      if (address) {
        // Determine user role based on their address
        setUserRole({
          isBuyer: false,
          isSeller: false,
          isAgent: false,
          isArbiter: false
        });
      }
    } catch (error) {
      console.error('Failed to load escrow details:', error);
      toast.error('Failed to load escrow details');
    } finally {
      setLoading(false);
    }
  };

  const handleDepositFunds = async () => {
    if (!escrow || !signer) return;
    
    setActionLoading(true);
    try {
      toast.success('Deposit functionality will be available once contracts are deployed');
    } catch (error) {
      console.error('Failed to deposit funds:', error);
      toast.error('Failed to deposit funds');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!escrow || !signer) return;
    
    setActionLoading(true);
    try {
      toast.success('Approval functionality will be available once contracts are deployed');
    } catch (error) {
      console.error('Failed to give approval:', error);
      toast.error('Failed to give approval');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseFunds = async () => {
    if (!escrow || !signer) return;
    
    setActionLoading(true);
    try {
      toast.success('Release functionality will be available once contracts are deployed');
    } catch (error) {
      console.error('Failed to release funds:', error);
      toast.error('Failed to release funds');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = async () => {
    const reason = prompt('Please provide a reason for the dispute:');
    if (!reason || !escrow || !signer) return;
    
    setActionLoading(true);
    try {
      toast.success('Dispute functionality will be available once contracts are deployed');
    } catch (error) {
      console.error('Failed to raise dispute:', error);
      toast.error('Failed to raise dispute');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusInfo = (status: EscrowStatus) => {
    const statusMap = {
      [EscrowStatus.CREATED]: { 
        color: 'text-primary', 
        bg: 'bg-primary-50', 
        text: 'Created',
        description: 'Escrow has been created, waiting for deposit'
      },
      [EscrowStatus.FUNDED]: { 
        color: 'text-primary', 
        bg: 'bg-primary-50', 
        text: 'Funded',
        description: 'Funds have been deposited, waiting for verification'
      },
      [EscrowStatus.VERIFIED]: { 
        color: 'text-accent-600', 
        bg: 'bg-accent-50', 
        text: 'Verified',
        description: 'Property verification completed, waiting for approvals'
      },
      [EscrowStatus.APPROVED]: { 
        color: 'text-accent-600', 
        bg: 'bg-accent-50', 
        text: 'Approved',
        description: 'All parties have approved, ready for completion'
      },
      [EscrowStatus.COMPLETED]: { 
        color: 'text-success-600', 
        bg: 'bg-success-50', 
        text: 'Completed',
        description: 'Transaction completed successfully'
      },
      [EscrowStatus.CANCELLED]: { 
        color: 'text-text-secondary', 
        bg: 'bg-gray-50', 
        text: 'Cancelled',
        description: 'Escrow has been cancelled'
      },
      [EscrowStatus.DISPUTED]: { 
        color: 'text-danger-600', 
        bg: 'bg-danger-50', 
        text: 'Disputed',
        description: 'Dispute raised, awaiting arbitration'
      },
      [EscrowStatus.RESOLVED]: { 
        color: 'text-success-600', 
        bg: 'bg-success-50', 
        text: 'Resolved',
        description: 'Dispute resolved by arbiter'
      }
    };
    return statusMap[status];
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-text-secondary mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Wallet Required</h2>
        <p className="text-text-secondary">Please connect your wallet to view escrow details</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-background rounded mr-4"></div>
          <div className="h-8 bg-background rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card h-32"></div>
            <div className="card h-48"></div>
          </div>
          <div className="card h-64"></div>
        </div>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-text-secondary mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Escrow Not Found</h2>
        <p className="text-text-secondary mb-4">
          The escrow you're looking for doesn't exist or you don't have access to it.
        </p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(escrow.status);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/')}
          className="mr-4 p-2 text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Escrow #{escrow.escrowId}</h1>
          <p className="text-text-secondary">Property ID: {escrow.propertyId}</p>
        </div>
        <div className={`px-4 py-2 rounded-full ${statusInfo.bg} ${statusInfo.color} font-semibold`}>
          {statusInfo.text}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Progress */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Transaction Status</h2>
            <div className={`p-4 rounded-xl ${statusInfo.bg} mb-4`}>
              <div className="flex items-center">
                <CheckCircle className={`h-5 w-5 ${statusInfo.color} mr-2`} />
                <span className={`font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
              </div>
              <p className="text-sm text-text-secondary mt-1">{statusInfo.description}</p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3">
              {[
                { status: EscrowStatus.CREATED, title: 'Escrow Created' },
                { status: EscrowStatus.FUNDED, title: 'Funds Deposited' },
                { status: EscrowStatus.VERIFIED, title: 'Property Verified' },
                { status: EscrowStatus.APPROVED, title: 'All Approvals Given' },
                { status: EscrowStatus.COMPLETED, title: 'Transaction Completed' }
              ].map((step, index) => {
                const isCompleted = escrow.status >= step.status;
                const isCurrent = escrow.status === step.status;
                
                return (
                  <div key={index} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      isCompleted ? 'bg-success' : isCurrent ? 'bg-primary' : 'bg-border'
                    }`} />
                    <span className={`text-sm ${
                      isCompleted ? 'text-text-primary' : 'text-text-secondary'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Transaction Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary">Deposit Amount</label>
                <p className="font-mono text-lg text-text-primary">{escrow.depositAmount} ETH</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Deposit Deadline</label>
                <p className="text-text-primary">{new Date(escrow.depositDeadline * 1000).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Created</label>
                <p className="text-text-primary">{new Date(escrow.createdAt * 1000).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Property ID</label>
                <p className="text-text-primary">{escrow.propertyId}</p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Participants</h2>
            <div className="space-y-4">
              {[
                { role: 'Buyer', address: escrow.buyer, approved: escrow.buyerApproval },
                { role: 'Seller', address: escrow.seller, approved: escrow.sellerApproval },
                { role: 'Agent', address: escrow.agent, approved: escrow.agentApproval },
                { role: 'Arbiter', address: escrow.arbiter, approved: false }
              ].map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">{participant.role}</p>
                    <p className="font-mono text-sm text-text-secondary">{participant.address}</p>
                  </div>
                  {participant.approved && (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Available Actions</h2>
            <div className="space-y-3">
              {userRole.isBuyer && escrow.status === EscrowStatus.CREATED && (
                <button
                  onClick={handleDepositFunds}
                  disabled={actionLoading}
                  className="w-full btn-primary"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Deposit Funds
                </button>
              )}

              {(userRole.isBuyer || userRole.isSeller || userRole.isAgent) && 
               escrow.status === EscrowStatus.VERIFIED && (
                <button
                  onClick={handleApproval}
                  disabled={actionLoading}
                  className="w-full btn-success"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Give Approval
                </button>
              )}

              {userRole.isSeller && escrow.status === EscrowStatus.APPROVED && (
                <button
                  onClick={handleReleaseFunds}
                  disabled={actionLoading}
                  className="w-full btn-success"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Release Funds
                </button>
              )}

              {escrow.status < EscrowStatus.COMPLETED && escrow.status !== EscrowStatus.DISPUTED && (
                <button
                  onClick={handleRaiseDispute}
                  disabled={actionLoading}
                  className="w-full btn-danger"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Raise Dispute
                </button>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Your Role:</span>
                <span className="font-medium">
                  {userRole.isBuyer && 'Buyer'}
                  {userRole.isSeller && 'Seller'}
                  {userRole.isAgent && 'Agent'}
                  {userRole.isArbiter && 'Arbiter'}
                  {!Object.values(userRole).some(Boolean) && 'Observer'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Verified:</span>
                <span className={escrow.isVerified ? 'text-success' : 'text-text-secondary'}>
                  {escrow.isVerified ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscrowDetails;