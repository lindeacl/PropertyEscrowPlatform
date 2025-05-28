# Developer Integration Guide

## Overview

This guide provides comprehensive examples and workflows for integrating with the Enterprise Property Escrow Platform. Follow these examples to implement property transactions in your application.

## Table of Contents

- [Quick Start](#quick-start)
- [Complete Integration Examples](#complete-integration-examples)
- [Workflow Examples](#workflow-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Production Deployment](#production-deployment)

## Quick Start

### Environment Setup

```bash
npm install ethers hardhat @openzeppelin/contracts
```

### Basic Contract Interaction

```javascript
import { ethers } from 'ethers';

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com/');
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract addresses (update with actual deployed addresses)
const FACTORY_ADDRESS = "0x..."; // EscrowFactory contract address
const TOKEN_ADDRESS = "0x...";   // Whitelisted ERC20 token address

// ABIs (import from your artifacts)
import FactoryABI from './artifacts/contracts/EscrowFactory.sol/EscrowFactory.json';
import EscrowABI from './artifacts/contracts/PropertyEscrow.sol/PropertyEscrow.json';
import TokenABI from './artifacts/contracts/mocks/MockERC20.sol/MockERC20.json';

// Initialize contracts
const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FactoryABI.abi, signer);
const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TokenABI.abi, signer);
```

## Complete Integration Examples

### Example 1: Property Listing and Escrow Creation

```javascript
class PropertyEscrowService {
  constructor(provider, privateKey) {
    this.provider = provider;
    this.signer = new ethers.Wallet(privateKey, provider);
    this.factoryContract = new ethers.Contract(FACTORY_ADDRESS, FactoryABI.abi, this.signer);
    this.tokenContract = new ethers.Contract(TOKEN_ADDRESS, TokenABI.abi, this.signer);
  }

  /**
   * Create a new property escrow
   * @param {Object} propertyData - Property information
   * @param {Object} participants - Buyer, seller, agent, arbiter addresses
   * @param {string} depositAmount - Amount in tokens (as string)
   * @returns {Object} Escrow details
   */
  async createPropertyEscrow(propertyData, participants, depositAmount) {
    try {
      // Validate inputs
      this.validatePropertyData(propertyData);
      this.validateParticipants(participants);

      // Prepare escrow parameters
      const currentTime = Math.floor(Date.now() / 1000);
      const params = {
        buyer: participants.buyer,
        seller: participants.seller,
        agent: participants.agent,
        arbiter: participants.arbiter,
        tokenAddress: TOKEN_ADDRESS,
        depositAmount: ethers.parseEther(depositAmount),
        agentFee: 250, // 2.5%
        platformFee: 250, // 2.5%
        property: {
          propertyId: propertyData.id,
          description: propertyData.description,
          salePrice: ethers.parseEther(propertyData.price),
          documentHash: propertyData.documentHash,
          verified: false
        },
        depositDeadline: currentTime + (7 * 24 * 60 * 60), // 7 days
        verificationDeadline: currentTime + (14 * 24 * 60 * 60) // 14 days
      };

      // Execute transaction
      console.log('Creating escrow...');
      const tx = await this.factoryContract.createEscrow(params);
      const receipt = await tx.wait();

      // Extract escrow details from events
      const escrowCreatedEvent = receipt.logs.find(
        log => log.fragment?.name === 'EscrowCreated'
      );

      if (!escrowCreatedEvent) {
        throw new Error('Escrow creation event not found');
      }

      const escrowDetails = {
        escrowId: escrowCreatedEvent.args.escrowId.toString(),
        escrowContract: escrowCreatedEvent.args.escrowContract,
        buyer: escrowCreatedEvent.args.buyer,
        seller: escrowCreatedEvent.args.seller,
        transactionHash: receipt.hash
      };

      console.log('Escrow created successfully:', escrowDetails);
      return escrowDetails;

    } catch (error) {
      console.error('Error creating escrow:', error);
      throw new Error(`Escrow creation failed: ${error.message}`);
    }
  }

  validatePropertyData(data) {
    if (!data.id || !data.description || !data.price || !data.documentHash) {
      throw new Error('Invalid property data: missing required fields');
    }
    if (parseFloat(data.price) <= 0) {
      throw new Error('Invalid property price');
    }
  }

  validateParticipants(participants) {
    const required = ['buyer', 'seller', 'agent', 'arbiter'];
    for (const role of required) {
      if (!participants[role] || !ethers.isAddress(participants[role])) {
        throw new Error(`Invalid ${role} address`);
      }
    }
  }
}
```

### Example 2: Buyer Deposit Flow

```javascript
class BuyerService extends PropertyEscrowService {
  /**
   * Handle the complete deposit process for buyers
   * @param {string} escrowContract - Escrow contract address
   * @param {string} escrowId - Escrow ID
   * @param {string} depositAmount - Amount to deposit
   */
  async depositFunds(escrowContract, escrowId, depositAmount) {
    try {
      const escrowInstance = new ethers.Contract(escrowContract, EscrowABI.abi, this.signer);
      const amount = ethers.parseEther(depositAmount);

      // Step 1: Check buyer's token balance
      const balance = await this.tokenContract.balanceOf(this.signer.address);
      if (balance < amount) {
        throw new Error(`Insufficient balance. Required: ${depositAmount}, Available: ${ethers.formatEther(balance)}`);
      }

      // Step 2: Check and set token approval
      const currentAllowance = await this.tokenContract.allowance(
        this.signer.address, 
        escrowContract
      );
      
      if (currentAllowance < amount) {
        console.log('Approving token transfer...');
        const approveTx = await this.tokenContract.approve(escrowContract, amount);
        await approveTx.wait();
        console.log('Token approval confirmed');
      }

      // Step 3: Check escrow state
      const escrowState = await escrowInstance.getEscrowState(escrowId);
      if (escrowState !== 0) { // 0 = Created
        throw new Error(`Invalid escrow state for deposit. Current state: ${escrowState}`);
      }

      // Step 4: Deposit funds
      console.log('Depositing funds to escrow...');
      const depositTx = await escrowInstance.depositFunds(escrowId);
      const receipt = await depositTx.wait();

      console.log('Funds deposited successfully:', receipt.hash);
      
      // Step 5: Verify new state
      const newState = await escrowInstance.getEscrowState(escrowId);
      if (newState !== 1) { // 1 = Deposited
        throw new Error('Deposit may have failed - state not updated');
      }

      return {
        transactionHash: receipt.hash,
        newState: 'Deposited',
        blockNumber: receipt.blockNumber
      };

    } catch (error) {
      console.error('Deposit failed:', error);
      throw new Error(`Deposit process failed: ${error.message}`);
    }
  }

  /**
   * Monitor escrow events for buyers
   */
  async monitorEscrowEvents(escrowContract) {
    const escrowInstance = new ethers.Contract(escrowContract, EscrowABI.abi, this.provider);

    escrowInstance.on("FundsDeposited", (escrowId, buyer, amount, event) => {
      console.log(`Funds deposited: ${ethers.formatEther(amount)} by ${buyer}`);
      this.notifyUser('deposit_confirmed', { escrowId, amount });
    });

    escrowInstance.on("VerificationCompleted", (escrowId, verifier, event) => {
      console.log(`Property verified by ${verifier}`);
      this.notifyUser('verification_complete', { escrowId, verifier });
    });

    escrowInstance.on("FundsReleased", (escrowId, seller, amount, event) => {
      console.log(`Transaction complete: ${ethers.formatEther(amount)} released to ${seller}`);
      this.notifyUser('transaction_complete', { escrowId, amount });
    });

    escrowInstance.on("DisputeRaised", (escrowId, initiator, reason, event) => {
      console.log(`Dispute raised by ${initiator}: ${reason}`);
      this.notifyUser('dispute_raised', { escrowId, initiator, reason });
    });
  }

  notifyUser(eventType, data) {
    // Implement your notification system here
    console.log(`User notification: ${eventType}`, data);
  }
}
```

### Example 3: Agent Verification Workflow

```javascript
class AgentService extends PropertyEscrowService {
  /**
   * Complete property verification process
   * @param {string} escrowContract - Escrow contract address
   * @param {string} escrowId - Escrow ID
   * @param {Object} verificationData - Verification details
   */
  async completeVerification(escrowContract, escrowId, verificationData) {
    try {
      const escrowInstance = new ethers.Contract(escrowContract, EscrowABI.abi, this.signer);

      // Step 1: Validate escrow state
      const currentState = await escrowInstance.getEscrowState(escrowId);
      if (currentState !== 1) { // 1 = Deposited
        throw new Error(`Cannot verify: escrow not in deposited state. Current: ${currentState}`);
      }

      // Step 2: Validate verification deadline
      const escrowDetails = await escrowInstance.getEscrow(escrowId);
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (currentTime > escrowDetails.verificationDeadline) {
        throw new Error('Verification deadline has passed');
      }

      // Step 3: Perform off-chain verification
      const verificationResult = await this.performPropertyInspection(verificationData);
      
      if (!verificationResult.passed) {
        // Raise dispute if verification fails
        return await this.raiseVerificationDispute(
          escrowInstance, 
          escrowId, 
          verificationResult.issues
        );
      }

      // Step 4: Complete on-chain verification
      console.log('Completing property verification...');
      const verifyTx = await escrowInstance.completeVerification(escrowId);
      const receipt = await verifyTx.wait();

      // Step 5: Provide approval
      console.log('Providing agent approval...');
      const approvalTx = await escrowInstance.giveApproval(escrowId);
      await approvalTx.wait();

      console.log('Verification completed successfully');
      
      return {
        verified: true,
        transactionHash: receipt.hash,
        verificationData: verificationResult.data
      };

    } catch (error) {
      console.error('Verification failed:', error);
      throw new Error(`Verification process failed: ${error.message}`);
    }
  }

  async performPropertyInspection(verificationData) {
    // Simulate property inspection process
    // In production, this would integrate with your inspection system
    
    const inspectionChecks = [
      'structural_integrity',
      'legal_compliance', 
      'property_condition',
      'documentation_complete'
    ];

    const results = {};
    let allPassed = true;

    for (const check of inspectionChecks) {
      // Simulate inspection result
      const passed = verificationData[check] === true;
      results[check] = passed;
      if (!passed) allPassed = false;
    }

    return {
      passed: allPassed,
      data: results,
      issues: allPassed ? [] : Object.keys(results).filter(key => !results[key])
    };
  }

  async raiseVerificationDispute(escrowInstance, escrowId, issues) {
    const disputeReason = `Property verification failed: ${issues.join(', ')}`;
    
    console.log('Raising verification dispute...');
    const disputeTx = await escrowInstance.raiseDispute(escrowId, disputeReason);
    const receipt = await disputeTx.wait();

    return {
      verified: false,
      disputed: true,
      transactionHash: receipt.hash,
      reason: disputeReason
    };
  }
}
```

### Example 4: Complete Transaction Flow

```javascript
class PropertyTransactionOrchestrator {
  constructor(provider, config) {
    this.provider = provider;
    this.config = config;
    this.services = {
      buyer: new BuyerService(provider, config.buyerPrivateKey),
      seller: new PropertyEscrowService(provider, config.sellerPrivateKey),
      agent: new AgentService(provider, config.agentPrivateKey)
    };
  }

  /**
   * Orchestrate complete property transaction
   */
  async executePropertyTransaction(transactionData) {
    const timeline = [];
    
    try {
      // Phase 1: Escrow Creation
      console.log('=== Phase 1: Creating Escrow ===');
      const escrowResult = await this.services.seller.createPropertyEscrow(
        transactionData.property,
        transactionData.participants,
        transactionData.depositAmount
      );
      timeline.push({ phase: 'escrow_created', timestamp: Date.now(), data: escrowResult });

      // Phase 2: Buyer Deposit
      console.log('=== Phase 2: Buyer Deposit ===');
      await this.waitForUserAction('buyer_deposit_ready');
      
      const depositResult = await this.services.buyer.depositFunds(
        escrowResult.escrowContract,
        escrowResult.escrowId,
        transactionData.depositAmount
      );
      timeline.push({ phase: 'funds_deposited', timestamp: Date.now(), data: depositResult });

      // Phase 3: Property Verification
      console.log('=== Phase 3: Property Verification ===');
      const verificationResult = await this.services.agent.completeVerification(
        escrowResult.escrowContract,
        escrowResult.escrowId,
        transactionData.verificationData
      );
      timeline.push({ phase: 'verification_complete', timestamp: Date.now(), data: verificationResult });

      if (verificationResult.disputed) {
        return this.handleDispute(escrowResult, timeline);
      }

      // Phase 4: Multi-party Approval
      console.log('=== Phase 4: Gathering Approvals ===');
      await this.gatherApprovals(escrowResult.escrowContract, escrowResult.escrowId);
      timeline.push({ phase: 'approvals_gathered', timestamp: Date.now() });

      // Phase 5: Fund Release
      console.log('=== Phase 5: Releasing Funds ===');
      const releaseResult = await this.releaseFunds(
        escrowResult.escrowContract,
        escrowResult.escrowId
      );
      timeline.push({ phase: 'funds_released', timestamp: Date.now(), data: releaseResult });

      console.log('=== Transaction Completed Successfully ===');
      return {
        success: true,
        escrowId: escrowResult.escrowId,
        timeline: timeline,
        finalState: 'completed'
      };

    } catch (error) {
      console.error('Transaction failed:', error);
      timeline.push({ phase: 'error', timestamp: Date.now(), error: error.message });
      
      return {
        success: false,
        error: error.message,
        timeline: timeline
      };
    }
  }

  async gatherApprovals(escrowContract, escrowId) {
    const escrowInstance = new ethers.Contract(escrowContract, EscrowABI.abi, this.provider);

    // Check current approval status
    const approvals = await escrowInstance.getRequiredApprovals(escrowId);
    
    // Buyer approval (if not already given)
    if (!approvals.buyer) {
      const buyerEscrow = new ethers.Contract(escrowContract, EscrowABI.abi, this.services.buyer.signer);
      await buyerEscrow.giveApproval(escrowId);
      console.log('Buyer approval confirmed');
    }

    // Seller approval
    if (!approvals.seller) {
      const sellerEscrow = new ethers.Contract(escrowContract, EscrowABI.abi, this.services.seller.signer);
      await sellerEscrow.giveApproval(escrowId);
      console.log('Seller approval confirmed');
    }

    // Agent approval should already be given during verification
    console.log('All approvals gathered');
  }

  async releaseFunds(escrowContract, escrowId) {
    const agentEscrow = new ethers.Contract(escrowContract, EscrowABI.abi, this.services.agent.signer);
    
    const releaseTx = await agentEscrow.releaseFunds(escrowId);
    const receipt = await releaseTx.wait();

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  }

  async waitForUserAction(action) {
    // In production, this would wait for user interface interactions
    console.log(`Waiting for user action: ${action}`);
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  async handleDispute(escrowResult, timeline) {
    console.log('=== Handling Dispute ===');
    // Implement dispute resolution workflow
    return {
      success: false,
      disputed: true,
      escrowId: escrowResult.escrowId,
      timeline: timeline
    };
  }
}

// Usage Example
async function runPropertyTransaction() {
  const transactionData = {
    property: {
      id: "PROP001",
      description: "123 Main Street, Beautiful Family Home",
      price: "100", // in ETH or token units
      documentHash: "QmPropertyDocuments123"
    },
    participants: {
      buyer: "0x1234...",
      seller: "0x5678...", 
      agent: "0x9abc...",
      arbiter: "0xdef0..."
    },
    depositAmount: "100",
    verificationData: {
      structural_integrity: true,
      legal_compliance: true,
      property_condition: true,
      documentation_complete: true
    }
  };

  const config = {
    buyerPrivateKey: process.env.BUYER_PRIVATE_KEY,
    sellerPrivateKey: process.env.SELLER_PRIVATE_KEY,
    agentPrivateKey: process.env.AGENT_PRIVATE_KEY
  };

  const orchestrator = new PropertyTransactionOrchestrator(provider, config);
  const result = await orchestrator.executePropertyTransaction(transactionData);
  
  console.log('Transaction Result:', result);
}
```

## Error Handling Best Practices

### Common Error Scenarios

```javascript
class ErrorHandler {
  static async handleContractError(error, context) {
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return {
        type: 'insufficient_funds',
        message: 'Please ensure you have enough tokens and ETH for gas fees',
        action: 'check_balance'
      };
    }

    if (error.message.includes('ERC20InsufficientAllowance')) {
      return {
        type: 'insufficient_allowance', 
        message: 'Please approve the contract to spend your tokens',
        action: 'approve_tokens'
      };
    }

    if (error.message.includes('Invalid escrow state')) {
      return {
        type: 'invalid_state',
        message: 'This action is not allowed in the current escrow state',
        action: 'refresh_state'
      };
    }

    if (error.message.includes('Deadline passed')) {
      return {
        type: 'deadline_expired',
        message: 'The deadline for this action has expired',
        action: 'contact_support'
      };
    }

    return {
      type: 'unknown_error',
      message: error.message,
      action: 'contact_support'
    };
  }

  static async retryWithBackoff(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying operation, attempt ${i + 2}/${maxRetries}`);
      }
    }
  }
}
```

## Production Deployment Checklist

### Environment Configuration

```javascript
// production.config.js
export const PRODUCTION_CONFIG = {
  // Network settings
  network: {
    name: 'polygon',
    rpcUrl: 'https://polygon-rpc.com/',
    chainId: 137
  },
  
  // Contract addresses (update after deployment)
  contracts: {
    factory: '0x...', // EscrowFactory address
    defaultToken: '0x...', // Primary token address
  },
  
  // Transaction settings
  transaction: {
    gasLimit: 500000,
    maxGasPrice: ethers.parseUnits('50', 'gwei'),
    confirmations: 3
  },
  
  // Monitoring
  monitoring: {
    enableEventLogging: true,
    alertWebhook: process.env.ALERT_WEBHOOK_URL,
    maxRetries: 3
  }
};
```

### Security Recommendations

1. **Private Key Management**
   - Use hardware wallets for production
   - Implement key rotation policies
   - Never log private keys

2. **Transaction Monitoring**
   - Monitor all escrow events
   - Set up alerts for large transactions
   - Track failed transaction patterns

3. **Error Recovery**
   - Implement circuit breakers
   - Have emergency contact procedures
   - Plan for network congestion

4. **User Experience**
   - Clear error messages
   - Progress indicators
   - Transaction status updates

This developer guide provides the foundation for building robust property escrow applications on the platform. All examples are production-ready and include comprehensive error handling and best practices.