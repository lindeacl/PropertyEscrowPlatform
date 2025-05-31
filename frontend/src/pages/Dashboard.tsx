import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Activity
} from 'lucide-react';
import { Card, Button, Grid, StatusChip } from '../components/ui';

const Dashboard: React.FC = () => {
  const { isConnected, connectWallet } = useWallet();
  const [stats, setStats] = useState({
    totalEscrows: 12,
    activeEscrows: 4,
    completedEscrows: 7,
    totalValue: '2,450,000',
    pendingApprovals: 2,
    disputes: 1
  });
  const [recentActivity, setRecentActivity] = useState([
    {
      id: '1',
      type: 'escrow_created',
      title: 'New escrow created',
      description: 'Modern Downtown Condo - $250,000 USDC',
      timestamp: '2 hours ago',
      icon: Plus,
      status: 'pending' as const
    },
    {
      id: '2', 
      type: 'funds_deposited',
      title: 'Funds deposited',
      description: 'Suburban Family Home - $450,000 USDC',
      timestamp: '1 day ago',
      icon: ArrowDownLeft,
      status: 'active' as const
    },
    {
      id: '3',
      type: 'escrow_completed',
      title: 'Escrow completed',
      description: 'City Apartment - $180,000 USDC',
      timestamp: '3 days ago',
      icon: CheckCircle,
      status: 'completed' as const
    },
    {
      id: '4',
      type: 'dispute_raised',
      title: 'Dispute raised',
      description: 'Luxury Penthouse - Inspection issues',
      timestamp: '1 week ago',
      icon: Shield,
      status: 'disputed' as const
    }
  ]);
  const [loading, setLoading] = useState(false);

  const summaryCards = [
    {
      title: 'Total Escrows',
      value: stats.totalEscrows.toString(),
      icon: FileText,
      color: 'bg-primary',
      change: '+2 this month'
    },
    {
      title: 'Active Escrows', 
      value: stats.activeEscrows.toString(),
      icon: Clock,
      color: 'bg-accent',
      change: '+1 today'
    },
    {
      title: 'Total Value',
      value: `$${stats.totalValue} USDC`,
      icon: DollarSign,
      color: 'bg-success',
      change: '+12% this month'
    },
    {
      title: 'Pending Actions',
      value: stats.pendingApprovals.toString(),
      icon: AlertCircle,
      color: 'bg-danger',
      change: 'Requires attention'
    }
  ];

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Card padding="lg">
          <Wallet className="mx-auto h-12 w-12 text-text-secondary dark:text-text-secondary-dark mb-4" />
          <h2 className="text-h2 font-semibold text-text-primary dark:text-text-primary-dark mb-2">Connect Your Wallet</h2>
          <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
            Please connect your wallet to view your escrow dashboard
          </p>
          <Button onClick={connectWallet} className="flex items-center mx-auto">
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-h1 font-bold text-text-primary dark:text-text-primary-dark">Dashboard</h1>
          <p className="text-text-secondary dark:text-text-secondary-dark mt-2">
            Manage your property escrow transactions securely
          </p>
        </div>
        <Link to="/create">
          <Button className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Start New Escrow
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <Grid cols={4} gap="md">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} hover padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary dark:text-text-secondary-dark text-sm font-medium">{card.title}</p>
                  <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mt-1">{card.value}</p>
                  <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-2">{card.change}</p>
                </div>
                <div className={`${card.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </Grid>

      {/* Recent Activity Feed */}
      <Grid cols={2} gap="lg">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 font-semibold text-text-primary dark:text-text-primary-dark flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Activity
            </h2>
            <Link to="/activity" className="text-primary hover:text-primary-600 text-sm font-medium transition-colors">
              View All
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-background/50 dark:hover:bg-background-dark/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary dark:text-text-primary-dark">{activity.title}</p>
                    <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{activity.description}</p>
                    <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-1">{activity.timestamp}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusChip status={activity.status}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </StatusChip>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-h2 font-semibold text-text-primary dark:text-text-primary-dark mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <Link to="/create">
              <Button variant="primary" className="w-full flex items-center justify-center">
                <Plus className="w-5 h-5 mr-2" />
                Create New Escrow
              </Button>
            </Link>
            <Link to="/escrows">
              <Button variant="secondary" className="w-full">
                View All Escrows
              </Button>
            </Link>
            <Link to="/transactions">
              <Button variant="secondary" className="w-full">
                Transaction History
              </Button>
            </Link>
            <div className="pt-4 border-t border-border dark:border-border-dark">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary dark:text-text-secondary-dark">Network Status</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                  <span className="text-success font-medium">Polygon Connected</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Grid>
    </div>
  );
};

export default Dashboard;