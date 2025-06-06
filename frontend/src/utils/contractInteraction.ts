import { ethers } from 'ethers';
import { getProvider, getConnectionStatus } from './provider';

// Contract ABIs - these would typically be imported from compiled artifacts
const ESCROW_FACTORY_ABI = [
  'function createEscrow(address _buyer, address _seller, address _arbiter, address _token, uint256 _amount, string memory _propertyDetails) external returns (address)',
  'function getEscrowCount() external view returns (uint256)',
  'function getEscrowAddress(uint256 _index) external view returns (address)',
  'function getAllEscrows() external view returns (address[])',
  'function owner() external view returns (address)',
  'event EscrowCreated(address indexed escrowAddress, address indexed buyer, address indexed seller, uint256 amount)'
];

const PROPERTY_ESCROW_ABI = [
  'function buyer() external view returns (address)',
  'function seller() external view returns (address)',
  'function arbiter() external view returns (address)',
  'function amount() external view returns (uint256)',
  'function token() external view returns (address)',
  'function status() external view returns (uint8)',
  'function propertyDetails() external view returns (string)',
  'function deposit() external payable',
  'function release() external',
  'function cancel() external',
  'function dispute() external',
  'function resolveDispute(bool _releaseFunds) external',
  'event FundsDeposited(address indexed depositor, uint256 amount)',
  'event FundsReleased(address indexed recipient, uint256 amount)',
  'event EscrowCancelled()',
  'event DisputeRaised()',
  'event DisputeResolved(bool releaseFunds)'
];

const MOCK_ERC20_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function mint(address to, uint256 amount) external'
];

// Default contract addresses for local development
const DEFAULT_ADDRESSES = {
  escrowFactory: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  mockToken: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
};

export interface ContractConfig {
  escrowFactoryAddress?: string;
  mockTokenAddress?: string;
}

export class ContractInteractionService {
  private provider: ethers.Provider | null;
  private signer: ethers.Signer | null;
  private config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    this.provider = getProvider();
    this.signer = null;
    this.config = {
      escrowFactoryAddress: config.escrowFactoryAddress || DEFAULT_ADDRESSES.escrowFactory,
      mockTokenAddress: config.mockTokenAddress || DEFAULT_ADDRESSES.mockToken
    };
  }

  async initialize(signer?: ethers.Signer): Promise<boolean> {
    try {
      if (signer) {
        this.signer = signer;
        this.provider = signer.provider;
      } else {
        const status = getConnectionStatus();
        if (!status.isConnected || !status.provider) {
          console.warn('No blockchain connection available');
          return false;
        }
        this.provider = status.provider;
      }

      // Test connection with a simple call
      if (this.provider) {
        await this.provider.getBlockNumber();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
      return false;
    }
  }

  getEscrowFactoryContract(withSigner = false): ethers.Contract | null {
    if (!this.provider) return null;
    
    try {
      const providerOrSigner = withSigner && this.signer ? this.signer : this.provider;
      return new ethers.Contract(
        this.config.escrowFactoryAddress!,
        ESCROW_FACTORY_ABI,
        providerOrSigner
      );
    } catch (error) {
      console.error('Failed to create escrow factory contract:', error);
      return null;
    }
  }

  getPropertyEscrowContract(address: string, withSigner = false): ethers.Contract | null {
    if (!this.provider) return null;
    
    try {
      const providerOrSigner = withSigner && this.signer ? this.signer : this.provider;
      return new ethers.Contract(address, PROPERTY_ESCROW_ABI, providerOrSigner);
    } catch (error) {
      console.error('Failed to create property escrow contract:', error);
      return null;
    }
  }

  getMockTokenContract(withSigner = false): ethers.Contract | null {
    if (!this.provider) return null;
    
    try {
      const providerOrSigner = withSigner && this.signer ? this.signer : this.provider;
      return new ethers.Contract(
        this.config.mockTokenAddress!,
        MOCK_ERC20_ABI,
        providerOrSigner
      );
    } catch (error) {
      console.error('Failed to create mock token contract:', error);
      return null;
    }
  }

  async createEscrow(params: {
    buyer: string;
    seller: string;
    arbiter: string;
    token: string;
    amount: string;
    propertyDetails: string;
  }): Promise<{ success: boolean; escrowAddress?: string; transactionHash?: string; error?: string }> {
    try {
      if (!this.signer) {
        return { success: false, error: 'No signer available - wallet not connected' };
      }

      const contract = this.getEscrowFactoryContract(true);
      if (!contract) {
        return { success: false, error: 'Contract not available' };
      }

      const tx = await contract.createEscrow(
        params.buyer,
        params.seller,
        params.arbiter,
        params.token,
        ethers.parseEther(params.amount),
        params.propertyDetails
      );

      const receipt = await tx.wait();
      
      // Extract escrow address from events
      const escrowCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'EscrowCreated';
        } catch {
          return false;
        }
      });

      let escrowAddress;
      if (escrowCreatedEvent) {
        const parsed = contract.interface.parseLog(escrowCreatedEvent);
        escrowAddress = parsed?.args?.escrowAddress;
      }

      return {
        success: true,
        escrowAddress,
        transactionHash: receipt.hash
      };
    } catch (error: any) {
      console.error('Failed to create escrow:', error);
      return {
        success: false,
        error: error.message || 'Failed to create escrow'
      };
    }
  }

  async getEscrowDetails(escrowAddress: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const contract = this.getPropertyEscrowContract(escrowAddress);
      if (!contract) {
        return { success: false, error: 'Contract not available' };
      }

      const [buyer, seller, arbiter, amount, token, status, propertyDetails] = await Promise.all([
        contract.buyer(),
        contract.seller(),
        contract.arbiter(),
        contract.amount(),
        contract.token(),
        contract.status(),
        contract.propertyDetails()
      ]);

      return {
        success: true,
        data: {
          buyer,
          seller,
          arbiter,
          amount: ethers.formatEther(amount),
          token,
          status: Number(status),
          propertyDetails,
          address: escrowAddress
        }
      };
    } catch (error: any) {
      console.error('Failed to get escrow details:', error);
      return {
        success: false,
        error: error.message || 'Failed to get escrow details'
      };
    }
  }

  async getAllEscrows(): Promise<{
    success: boolean;
    escrows?: string[];
    error?: string;
  }> {
    try {
      const contract = this.getEscrowFactoryContract();
      if (!contract) {
        return { success: false, error: 'Contract not available' };
      }

      const escrows = await contract.getAllEscrows();
      return {
        success: true,
        escrows: escrows
      };
    } catch (error: any) {
      console.error('Failed to get all escrows:', error);
      return {
        success: false,
        error: error.message || 'Failed to get escrows'
      };
    }
  }

  async depositFunds(escrowAddress: string, amount: string): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      if (!this.signer) {
        return { success: false, error: 'No signer available - wallet not connected' };
      }

      const contract = this.getPropertyEscrowContract(escrowAddress, true);
      if (!contract) {
        return { success: false, error: 'Contract not available' };
      }

      const tx = await contract.deposit({
        value: ethers.parseEther(amount)
      });

      const receipt = await tx.wait();
      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error: any) {
      console.error('Failed to deposit funds:', error);
      return {
        success: false,
        error: error.message || 'Failed to deposit funds'
      };
    }
  }

  async releaseFunds(escrowAddress: string): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      if (!this.signer) {
        return { success: false, error: 'No signer available - wallet not connected' };
      }

      const contract = this.getPropertyEscrowContract(escrowAddress, true);
      if (!contract) {
        return { success: false, error: 'Contract not available' };
      }

      const tx = await contract.release();
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error: any) {
      console.error('Failed to release funds:', error);
      return {
        success: false,
        error: error.message || 'Failed to release funds'
      };
    }
  }

  setSigner(signer: ethers.Signer) {
    this.signer = signer;
    this.provider = signer.provider;
  }

  updateConfig(config: Partial<ContractConfig>) {
    this.config = { ...this.config, ...config };
  }

  isInitialized(): boolean {
    return this.provider !== null;
  }
}

// Singleton instance
export const contractService = new ContractInteractionService();