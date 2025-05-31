import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import { EscrowData, EscrowStatus, DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const { isConnected, address } = useWallet();
  const [stats, setStats] = useState<DashboardStats>({
    totalEscrows: 0,
    activeEscrows: 0,
    completedEscrows: 0,
    totalValue: '0',
    pendingApprovals: 0,
    disputes: 0
  });
  const [recentEscrows, setRecentEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      loadDashboardData();
    }
  }, [isConnected, address]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load real data from blockchain when contracts are deployed
      // For now, initialize with empty state
      setStats({
        totalEscrows: 0,
        activeEscrows: 0,
        completedEscrows: 0,
        totalValue: '0',
        pendingApprovals: 0,
        disputes: 0
      });
      setRecentEscrows([]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: EscrowStatus) => {
    const statusMap = {
      [EscrowStatus.CREATED]: { class: 'status-created', text: 'Created' },
      [EscrowStatus.FUNDED]: { class: 'status-funded', text: 'Funded' },
      [EscrowStatus.VERIFIED]: { class: 'status-verified', text: 'Verified' },
      [EscrowStatus.APPROVED]: { class: 'status-approved', text: 'Approved' },
      [EscrowStatus.COMPLETED]: { class: 'status-completed', text: 'Completed' },
      [EscrowStatus.CANCELLED]: { class: 'status-cancelled', text: 'Cancelled' },
      [EscrowStatus.DISPUTED]: { class: 'status-disputed', text: 'Disputed' },
      [EscrowStatus.RESOLVED]: { class: 'status-resolved', text: 'Resolved' }
    };
    
    const statusInfo = statusMap[status];
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Wallet className="mx-auto h-12 w-12 text-text-secondary mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Connect Your Wallet</h2>
        <p className="text-text-secondary">Please connect your wallet to view your escrow dashboard</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-4 bg-background rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-background rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="h-6 bg-background rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-background rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary">Manage your property escrow transactions</p>
        </div>
        <Link to="/create" className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Create Escrow
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Total Escrows</p>
              <p className="text-2xl font-bold text-text-primary">{stats.totalEscrows}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-accent" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Active Escrows</p>
              <p className="text-2xl font-bold text-text-primary">{stats.activeEscrows}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-success" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Total Value</p>
              <p className="text-2xl font-bold text-text-primary">{stats.totalValue} ETH</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-danger" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Pending Actions</p>
              <p className="text-2xl font-bold text-text-primary">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Escrows */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">Recent Escrows</h2>
          <Link to="/escrows" className="text-primary hover:text-primary-700 font-medium">
            View all
          </Link>
        </div>

        {recentEscrows.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-text-secondary mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No escrows yet</h3>
            <p className="text-text-secondary mb-4">Start by creating your first property escrow</p>
            <Link to="/create" className="btn-primary">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Escrow
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Property ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Created
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentEscrows.map((escrow) => (
                  <tr key={escrow.escrowId} className="hover:bg-background">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-text-primary">{escrow.propertyId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-text-primary">{escrow.depositAmount} ETH</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(escrow.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                      {new Date(escrow.createdAt * 1000).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/escrow/${escrow.escrowId}`}
                        className="text-primary hover:text-primary-700"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;