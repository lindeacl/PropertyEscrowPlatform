import { ethers } from 'ethers';

// Contract addresses (updated with deployed contract addresses)
export const CONTRACT_ADDRESSES = {
  ESCROW_FACTORY: process.env.REACT_APP_ESCROW_FACTORY_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  PROPERTY_ESCROW: process.env.REACT_APP_PROPERTY_ESCROW_ADDRESS || '',
  MOCK_TOKEN: process.env.REACT_APP_MOCK_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
};

// Contract ABIs - Updated to match actual deployed contracts
export const ESCROW_FACTORY_ABI = [
  "function createEscrow(tuple(address buyer, address seller, address agent, address arbiter, address tokenAddress, uint256 depositAmount, uint256 agentFee, uint256 platformFee, tuple(string propertyId, string title, string description, string location, uint256 price, bool verified) property, uint256 depositDeadline, uint256 verificationDeadline)) external returns (address escrowContract, uint256 escrowId)",
  "function getEscrowContract(uint256 escrowId) external view returns (address)",
  "function getTotalEscrows() external view returns (uint256)",
  "function whitelistedTokens(address token) external view returns (bool)",
  "function whitelistToken(address token, bool whitelisted) external",
  "function platformWallet() external view returns (address)",
  "event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, address escrowContract)",
  "event TokenWhitelisted(address indexed token, bool whitelisted)"
];

export const PROPERTY_ESCROW_ABI = [
  "function depositFunds(uint256 escrowId) external",
  "function completeVerification(uint256 escrowId) external", 
  "function giveApproval(uint256 escrowId) external",
  "function releaseFunds(uint256 escrowId) external",
  "function cancelEscrow(uint256 escrowId) external",
  "function raiseDispute(uint256 escrowId, string reason) external",
  "function resolveDispute(uint256 escrowId, bool favorBuyer, string resolution) external",
  "function getEscrowDetails(uint256 escrowId) external view returns (tuple(address buyer, address seller, address agent, address arbiter, address tokenAddress, uint256 depositAmount, uint256 depositDeadline, string propertyId, uint8 status, uint256 createdAt, bool buyerApproval, bool sellerApproval, bool agentApproval, bool isVerified, string disputeReason, string resolutionText))",
  "function canReleaseFunds(uint256 escrowId) external view returns (bool)",
  "event FundsDeposited(uint256 indexed escrowId, address indexed buyer, uint256 amount)",
  "event VerificationCompleted(uint256 indexed escrowId, address indexed agent)",
  "event ApprovalGiven(uint256 indexed escrowId, address indexed approver)",
  "event FundsReleased(uint256 indexed escrowId, address indexed seller, uint256 amount, uint256 platformFee)",
  "event EscrowCancelled(uint256 indexed escrowId, string reason)",
  "event DisputeRaised(uint256 indexed escrowId, address indexed initiator, string reason)",
  "event DisputeResolved(uint256 indexed escrowId, address indexed arbiter, bool favorBuyer, string resolution)"
];

export const ERC20_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const getContract = (
  address: string,
  abi: string[],
  signerOrProvider: ethers.Signer | ethers.Provider
) => {
  return new ethers.Contract(address, abi, signerOrProvider);
};

export const formatEther = ethers.formatEther;
export const parseEther = ethers.parseEther;
export const formatUnits = ethers.formatUnits;
export const parseUnits = ethers.parseUnits;