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
  
  // Show dashboard immediately for demonstration - bypass wallet requirement
  const showDashboard = true;
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

  if (!showDashboard && !isConnected) {
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
    <div className="space-y-8 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Professional Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Property Escrow Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Enterprise-grade property transaction management platform
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">System Operational</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Activity Log
            </Button>
            <Link to="/create">
              <Button className="flex items-center bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Create New Escrow
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Key Metrics Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold">$2.4B</div>
            <div className="text-blue-200">Total Volume</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">1,247</div>
            <div className="text-blue-200">Active Escrows</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">99.8%</div>
            <div className="text-blue-200">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">24hrs</div>
            <div className="text-blue-200">Avg Settlement</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <Grid cols={4} gap="md">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} padding="md">
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