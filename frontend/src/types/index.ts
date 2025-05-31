// Core escrow types
export interface EscrowData {
  escrowId: number;
  buyer: string;
  seller: string;
  agent: string;
  arbiter: string;
  tokenAddress: string;
  depositAmount: string;
  depositDeadline: number;
  propertyId: string;
  status: EscrowStatus;
  createdAt: number;
  buyerApproval: boolean;
  sellerApproval: boolean;
  agentApproval: boolean;
  isVerified: boolean;
  disputeReason?: string;
  resolutionText?: string;
}

export enum EscrowStatus {
  CREATED = 0,
  FUNDED = 1,
  VERIFIED = 2,
  APPROVED = 3,
  COMPLETED = 4,
  CANCELLED = 5,
  DISPUTED = 6,
  RESOLVED = 7
}

export interface CreateEscrowParams {
  buyer: string;
  seller: string;
  agent: string;
  arbiter: string;
  tokenAddress: string;
  depositAmount: string;
  depositDeadline: number;
  propertyId: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  isWhitelisted: boolean;
}

export interface UserRole {
  isBuyer: boolean;
  isSeller: boolean;
  isAgent: boolean;
  isArbiter: boolean;
}

export interface TransactionState {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  hash?: string;
  error?: string;
}

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface DashboardStats {
  totalEscrows: number;
  activeEscrows: number;
  completedEscrows: number;
  totalValue: string;
  pendingApprovals: number;
  disputes: number;
}