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
  MessageSquare,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EscrowData, EscrowStatus, UserRole } from '../types';
import DisputeModal from '../components/modals/DisputeModal';
import { Card, Button, StatusChip, Modal, Tooltip, AuditLog, AccessibleModal } from '../components/ui';
import { microcopy, getTooltipContent, getReassurance } from '../utils/microcopy';

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
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditEntries, setAuditEntries] = useState<any[]>([]);

  useEffect(() => {
    if (isConnected && id) {
      loadEscrowDetails();
    }
  }, [isConnected, id, address]);

  const loadEscrowDetails = async () => {
    try {
      setLoading(true);
      
      // Sample escrow data for demonstration
      const sampleEscrow: EscrowData = {
        escrowId: parseInt(id || '1'),
        propertyId: 'PROP-2025-001',
        buyer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        seller: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        agent: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        arbiter: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        depositAmount: '2.5',
        depositDeadline: Math.floor(Date.now() / 1000) + 604800, // 1 week from now
        createdAt: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        status: EscrowStatus.VERIFIED,
        isVerified: true,
        buyerApproval: true,
        sellerApproval: false,
        agentApproval: true
      };
      
      setEscrow(sampleEscrow);
      
      // Sample audit log data for demonstration
      const sampleAuditEntries = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          action: 'Created',
          actor: sampleEscrow.seller,
          actorRole: 'seller' as const,
          description: 'Escrow contract created for property PROP-2025-001',
          transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
          blockNumber: 45123456,
          gasUsed: '142,351',
          details: {
            propertyId: 'PROP-2025-001',
            depositAmount: '2.5 ETH',
            deadline: '7 days'
          }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 82800000), // 23 hours ago
          action: 'Verified',
          actor: sampleEscrow.agent,
          actorRole: 'agent' as const,
          description: 'Property documentation verified and escrow approved',
          transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12',
          blockNumber: 45123478,
          gasUsed: '98,234',
          details: {
            verificationStatus: 'Approved',
            documentsReviewed: '5 files'
          }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 72000000), // 20 hours ago
          action: 'Deposited',
          actor: sampleEscrow.buyer,
          actorRole: 'buyer' as const,
          description: 'Buyer deposited 2.5 ETH into escrow contract',
          transactionHash: '0x567890abcdef1234567890abcdef1234567890ab',
          blockNumber: 45123512,
          gasUsed: '156,789',
          details: {
            amount: '2.5 ETH',
            confirmations: '24'
          }
        }
      ];
      
      setAuditEntries(sampleAuditEntries);
      
      if (address) {
        // Determine user role based on their address
        setUserRole({
          isBuyer: address.toLowerCase() === sampleEscrow.buyer.toLowerCase(),
          isSeller: address.toLowerCase() === sampleEscrow.seller.toLowerCase(),
          isAgent: address.toLowerCase() === sampleEscrow.agent.toLowerCase(),
          isArbiter: address.toLowerCase() === sampleEscrow.arbiter.toLowerCase()
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
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async (reason: string, description: string, evidence: File[]) => {
    if (!escrow || !signer) return;
    
    setActionLoading(true);
    try {
      // Contract integration will be implemented here
      toast.success(`Dispute submitted successfully with reason: ${reason}`);
      toast.success(`Evidence files uploaded: ${evidence.length}`);
    } catch (error) {
      console.error('Failed to submit dispute:', error);
      toast.error('Failed to submit dispute');
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!escrow || !signer) return;
    
    setActionLoading(true);
    try {
      toast.success('Dispute resolution functionality will be available once contracts are deployed');
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      toast.error('Failed to resolve dispute');
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
          className="mr-4 p-2 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg transition-colors"
          aria-label="Back to Dashboard"
          tabIndex={0}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text-primary">
              Escrow #{escrow.escrowId}
            </h1>
            <Tooltip content={getTooltipContent('escrow')} icon={true} />
          </div>
          <p className="text-text-secondary">Property ID: {escrow.propertyId}</p>
          <div className="mt-2 text-sm text-success flex items-center gap-1">
            <Shield className="h-4 w-4" />
            {getReassurance('fundsSecure')}
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full ${statusInfo.bg} ${statusInfo.color} font-semibold`} role="status" aria-live="polite">
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

            {/* Enhanced Progress Stepper */}
            <div className="relative">
              {[
                { 
                  status: EscrowStatus.CREATED, 
                  title: 'Escrow Created',
                  description: 'Smart contract deployed and initialized',
                  icon: FileText
                },
                { 
                  status: EscrowStatus.FUNDED, 
                  title: 'Funds Deposited',
                  description: 'Buyer has deposited the required amount',
                  icon: DollarSign
                },
                { 
                  status: EscrowStatus.VERIFIED, 
                  title: 'Property Verified',
                  description: 'Agent has completed property verification',
                  icon: CheckCircle
                },
                { 
                  status: EscrowStatus.APPROVED, 
                  title: 'All Approvals Given',
                  description: 'All parties have approved the transaction',
                  icon: Users
                },
                { 
                  status: EscrowStatus.COMPLETED, 
                  title: 'Transaction Completed',
                  description: 'Funds released and ownership transferred',
                  icon: CheckCircle
                }
              ].map((step, index) => {
                const isCompleted = escrow.status > step.status;
                const isCurrent = escrow.status === step.status;
                const isUpcoming = escrow.status < step.status;
                const Icon = step.icon;
                
                return (
                  <div key={index} className="relative">
                    {index > 0 && (
                      <div className={`absolute left-4 -top-6 w-0.5 h-6 ${
                        isCompleted ? 'bg-success' : 'bg-border'
                      }`} />
                    )}
                    <div className="flex items-start space-x-3 pb-6">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        isCompleted 
                          ? 'bg-success border-success text-white' 
                          : isCurrent 
                            ? 'bg-primary border-primary text-white'
                            : 'bg-background border-border text-text-secondary'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          isCompleted || isCurrent ? 'text-text-primary' : 'text-text-secondary'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {step.description}
                        </p>
                        {isCurrent && (
                          <div className="mt-2">
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-50 text-primary">
                              <Clock className="w-3 h-3 mr-1" />
                              Current Step
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Property Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Property Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Property ID</label>
                  <p className="text-text-primary font-mono">{escrow.propertyId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Property Address</label>
                  <p className="text-text-primary">123 Blockchain Avenue, Crypto City, CC 12345</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Property Type</label>
                  <p className="text-text-primary">Single Family Home</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Square Footage</label>
                  <p className="text-text-primary">2,500 sq ft</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Sale Price</label>
                  <p className="text-text-primary font-mono text-lg">250.0 ETH</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Deposit Amount (10%)</label>
                  <p className="text-text-primary font-mono text-lg">{escrow.depositAmount} ETH</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Listing Date</label>
                  <p className="text-text-primary">March 15, 2025</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary">Expected Closing</label>
                  <p className="text-text-primary">June 30, 2025</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Timeline */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Transaction Timeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary">Created</label>
                <p className="text-text-primary">{new Date(escrow.createdAt * 1000).toLocaleDateString()}</p>
                <p className="text-xs text-text-secondary">{new Date(escrow.createdAt * 1000).toLocaleTimeString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Deposit Deadline</label>
                <p className="text-text-primary">{new Date(escrow.depositDeadline * 1000).toLocaleDateString()}</p>
                <p className="text-xs text-text-secondary">{new Date(escrow.depositDeadline * 1000).toLocaleTimeString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary">Days Remaining</label>
                <p className="text-text-primary font-semibold">
                  {Math.max(0, Math.ceil((escrow.depositDeadline * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))} days
                </p>
              </div>
            </div>
          </div>

          {/* Documents & Verification */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Documents & Verification</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-text-secondary mr-3" />
                  <div>
                    <p className="font-medium text-text-primary">Property Deed</p>
                    <p className="text-sm text-text-secondary">Uploaded by Seller</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <button className="text-primary hover:text-primary-600 text-sm">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-text-secondary mr-3" />
                  <div>
                    <p className="font-medium text-text-primary">Inspection Report</p>
                    <p className="text-sm text-text-secondary">Uploaded by Agent</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <button className="text-primary hover:text-primary-600 text-sm">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-background rounded-lg border-2 border-dashed border-border">
                <div className="flex items-center">
                  <Upload className="h-5 w-5 text-text-secondary mr-3" />
                  <div>
                    <p className="font-medium text-text-primary">Appraisal Report</p>
                    <p className="text-sm text-text-secondary">Pending upload</p>
                  </div>
                </div>
                <button className="btn-secondary text-sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </button>
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

              {userRole.isAgent && escrow.status === EscrowStatus.FUNDED && (
                <button
                  onClick={handleApproval}
                  disabled={actionLoading}
                  className="w-full btn-primary"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify Property
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

              {(userRole.isBuyer || userRole.isSeller || userRole.isAgent) && (
                <button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="w-full btn-secondary"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </button>
              )}

              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.png"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    toast.success(`Document "${e.target.files[0].name}" uploaded successfully`);
                  }
                }}
              />

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
              <div className="flex justify-between">
                <span className="text-text-secondary">Approvals:</span>
                <span className="text-text-primary">
                  {[escrow.buyerApproval, escrow.sellerApproval, escrow.agentApproval].filter(Boolean).length}/3
                </span>
              </div>
            </div>
          </div>

          {/* Communication */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Communication</h2>
            <div className="space-y-3">
              <button className="w-full btn-secondary">
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Participants
              </button>
              
              {userRole.isArbiter && escrow.status === EscrowStatus.DISPUTED && (
                <button 
                  onClick={handleResolveDispute}
                  disabled={actionLoading}
                  className="w-full btn-primary"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolve Dispute
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Section */}
      <div className="mt-8">
        <AuditLog 
          entries={auditEntries}
          showTransactionDetails={true}
          blockExplorerUrl="https://polygonscan.com"
          className="mb-6"
        />
      </div>

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        onSubmit={handleSubmitDispute}
        escrowId={escrow?.escrowId || 0}
      />

      {/* Audit Log Modal */}
      <AccessibleModal
        isOpen={showAuditLog}
        onClose={() => setShowAuditLog(false)}
        title="Complete Audit Log"
        size="xl"
        ariaDescribedBy="audit-log-description"
      >
        <div id="audit-log-description" className="p-6">
          <p className="text-text-secondary mb-4">
            {getReassurance('transparentProcess')}
          </p>
          <AuditLog 
            entries={auditEntries}
            showTransactionDetails={true}
            blockExplorerUrl="https://polygonscan.com"
          />
        </div>
      </AccessibleModal>
    </div>
  );
};

export default EscrowDetails;