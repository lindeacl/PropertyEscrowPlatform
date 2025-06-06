import { ethers } from 'ethers';
import { getProvider, getConnectionStatus } from './provider';
import { ESCROW_FACTORY_ABI, PROPERTY_ESCROW_ABI, MOCK_ERC20_ABI } from './contractABI';



// Default contract addresses for local development
const DEFAULT_ADDRESSES = {
  escrowFactory: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  mockToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
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
    this.provider = null;
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
    agent?: string;
    arbiter?: string;
    token: string;
    amount: string;
    propertyId: string;
    propertyDetails: string;
    salePrice?: string;
    agentFee?: string;
    platformFee?: string;
  }): Promise<{ success: boolean; escrowAddress?: string; transactionHash?: string; error?: string }> {
    try {
      if (!this.signer) {
        return { success: false, error: 'No signer available - wallet not connected' };
      }

      const contract = this.getEscrowFactoryContract(true);
      if (!contract) {
        return { success: false, error: 'Contract not available' };
      }

      // Calculate deadlines (24 hours for deposit, 7 days for verification)
      const now = Math.floor(Date.now() / 1000);
      const depositDeadline = now + (24 * 60 * 60); // 24 hours
      const verificationDeadline = now + (7 * 24 * 60 * 60); // 7 days

      // Create the structured parameters matching CreateEscrowParams
      const createEscrowParams = {
        buyer: params.buyer,
        seller: params.seller,
        agent: params.agent || ethers.ZeroAddress, // Will use default if zero address
        arbiter: params.arbiter || ethers.ZeroAddress, // Will use default if zero address
        tokenAddress: params.token,
        depositAmount: ethers.parseEther(params.amount),
        agentFee: ethers.parseEther(params.agentFee || "0.01"), // Default 0.01 ETH
        platformFee: ethers.parseEther(params.platformFee || "0.005"), // Default 0.005 ETH
        property: {
          propertyId: params.propertyId,
          description: params.propertyDetails,
          salePrice: ethers.parseEther(params.salePrice || params.amount),
          documentHash: "QmDefault123", // Default IPFS hash
          verified: false
        },
        depositDeadline: depositDeadline,
        verificationDeadline: verificationDeadline
      };

      const tx = await contract.createEscrow(createEscrowParams);

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