import React from 'react';
import { Clock, ExternalLink, User, FileText, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { CopyButton } from './index';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  actor: string;
  actorRole: 'buyer' | 'seller' | 'agent' | 'arbiter' | 'system';
  description: string;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  details?: Record<string, any>;
}

interface AuditLogProps {
  entries: AuditLogEntry[];
  className?: string;
  showTransactionDetails?: boolean;
  blockExplorerUrl?: string;
}

const AuditLog: React.FC<AuditLogProps> = ({
  entries,
  className = '',
  showTransactionDetails = true,
  blockExplorerUrl = 'https://polygonscan.com'
}) => {
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
      case 'initialized':
        return <FileText className="h-4 w-4 text-primary" />;
      case 'deposited':
      case 'funded':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'released':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'disputed':
      case 'escalated':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="h-4 w-4 text-danger" />;
      default:
        return <Clock className="h-4 w-4 text-text-secondary" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'buyer':
        return 'text-blue-600 bg-blue-50';
      case 'seller':
        return 'text-green-600 bg-green-50';
      case 'agent':
        return 'text-purple-600 bg-purple-50';
      case 'arbiter':
        return 'text-orange-600 bg-orange-50';
      case 'system':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-text-secondary bg-background';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(timestamp);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className={`bg-surface rounded-xl border border-border ${className}`}>
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Audit Log
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Complete history of all escrow activities and transactions
        </p>
      </div>

      <div className="p-6">
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-text-secondary mx-auto mb-3" />
            <p className="text-text-secondary">No audit entries yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="relative flex gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0"
              >
                {/* Timeline connector */}
                {index < entries.length - 1 && (
                  <div className="absolute left-5 top-8 w-px h-full bg-border" />
                )}

                {/* Action icon */}
                <div className="flex-shrink-0 w-10 h-10 bg-background border border-border rounded-full flex items-center justify-center">
                  {getActionIcon(entry.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-text-primary">
                          {entry.action}
                        </span>
                        <span className={`
                          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                          ${getRoleColor(entry.actorRole)}
                        `}>
                          <User className="h-3 w-3 mr-1" />
                          {entry.actorRole}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-2">
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span>{formatTimestamp(entry.timestamp)}</span>
                        {entry.actor && (
                          <CopyButton
                            text={entry.actor}
                            label="Actor address"
                            showText={true}
                            truncate={true}
                            variant="inline"
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Transaction details */}
                  {showTransactionDetails && entry.transactionHash && (
                    <div className="mt-3 p-3 bg-background rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-text-primary">
                          Transaction Details
                        </span>
                        <a
                          href={`${blockExplorerUrl}/tx/${entry.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-600 transition-colors"
                        >
                          View on Explorer
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Hash:</span>
                          <CopyButton
                            text={entry.transactionHash}
                            label="Transaction hash"
                            showText={true}
                            truncate={true}
                            variant="inline"
                            size="sm"
                          />
                        </div>
                        {entry.blockNumber && (
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Block:</span>
                            <span className="text-text-primary">#{entry.blockNumber.toLocaleString()}</span>
                          </div>
                        )}
                        {entry.gasUsed && (
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Gas Used:</span>
                            <span className="text-text-primary">{entry.gasUsed}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional details */}
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <div className="mt-3 p-3 bg-background rounded-lg border border-border">
                      <span className="text-xs font-medium text-text-primary block mb-2">
                        Additional Details
                      </span>
                      <div className="space-y-1 text-xs">
                        {Object.entries(entry.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-text-secondary capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="text-text-primary">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;