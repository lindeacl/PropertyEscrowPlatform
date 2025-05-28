# Smart Contract API Documentation

## Overview

This document provides comprehensive API documentation for the Enterprise Property Escrow Platform smart contracts. All contracts are deployed on Polygon and follow OpenZeppelin standards for security and compatibility.

## Contract Addresses

### Mainnet (Polygon)
- **EscrowFactory**: `TBD - Deploy to mainnet`
- **Mock Token**: `TBD - Use actual tokens`

### Testnet (Mumbai)
- **EscrowFactory**: `TBD - Deploy to testnet`
- **Mock Token**: `TBD - For testing only`

## EscrowFactory Contract

### Overview
The EscrowFactory contract is the main entry point for creating and managing property escrow contracts. It handles token whitelisting, default role management, and escrow deployment.

### Interface: IEscrowFactory

#### Functions

##### `createEscrow(CreateEscrowParams calldata params) → (address escrowContract, uint256 escrowId)`

Creates a new property escrow contract with specified parameters.

**Parameters:**
- `params` (CreateEscrowParams): Complete escrow configuration

**Returns:**
- `escrowContract` (address): Address of the deployed escrow contract
- `escrowId` (uint256): Unique identifier for the escrow

**Requirements:**
- Caller must have sufficient gas
- Token must be whitelisted
- All addresses must be valid (non-zero)
- Deposit amount must be greater than zero
- Deadlines must be in the future

**Events Emitted:**
- `EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, address escrowContract)`

**Example Usage:**
```solidity
CreateEscrowParams memory params = CreateEscrowParams({
    buyer: 0x1234....,
    seller: 0x5678....,
    agent: 0x9abc....,
    arbiter: 0xdef0....,
    tokenAddress: 0x2791....,
    depositAmount: 100e18,
    agentFee: 250,
    platformFee: 250,
    property: Property({
        propertyId: "PROP001",
        description: "123 Main Street",
        salePrice: 100e18,
        documentHash: "QmHash...",
        verified: false
    }),
    depositDeadline: block.timestamp + 86400,
    verificationDeadline: block.timestamp + 172800
});

(address escrow, uint256 id) = factory.createEscrow(params);
```

##### `whitelistToken(address token, bool whitelisted)`

Manages the token whitelist for accepted payment methods.

**Parameters:**
- `token` (address): ERC20 token contract address
- `whitelisted` (bool): Whether to whitelist (true) or remove (false)

**Access Control:**
- Only contract owner can call this function

**Events Emitted:**
- `TokenWhitelisted(address indexed token, bool whitelisted)`

##### `isTokenWhitelisted(address token) → bool`

Checks if a token is whitelisted for escrow payments.

**Parameters:**
- `token` (address): Token contract address to check

**Returns:**
- `bool`: True if token is whitelisted, false otherwise

##### `getEscrowContract(uint256 escrowId) → address`

Retrieves the contract address for a specific escrow ID.

**Parameters:**
- `escrowId` (uint256): Escrow identifier

**Returns:**
- `address`: Contract address of the escrow

**Requirements:**
- Escrow ID must exist (valid)

##### `setPlatformFee(uint256 fee)`

Updates the platform fee percentage (in basis points).

**Parameters:**
- `fee` (uint256): Fee in basis points (e.g., 250 = 2.5%)

**Access Control:**
- Only contract owner can call this function

**Requirements:**
- Fee must be reasonable (typically < 1000 basis points)

##### `setDefaultAgent(address agent)`

Sets the default agent address for new escrows.

**Parameters:**
- `agent` (address): New default agent address

**Access Control:**
- Only contract owner can call this function

##### `setDefaultArbiter(address arbiter)`

Sets the default arbiter address for dispute resolution.

**Parameters:**
- `arbiter` (address): New default arbiter address

**Access Control:**
- Only contract owner can call this function

#### View Functions

##### `platformWallet() → address`

Returns the platform wallet address for fee collection.

##### `getDefaultAgent() → address`

Returns the current default agent address.

##### `getDefaultArbiter() → address`

Returns the current default arbiter address.

#### Events

##### `EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, address escrowContract)`

Emitted when a new escrow is created.

##### `TokenWhitelisted(address indexed token, bool whitelisted)`

Emitted when token whitelist status changes.

##### `PlatformFeeUpdated(uint256 newFee)`

Emitted when platform fee is updated.

##### `DefaultAgentSet(address indexed agent)`

Emitted when default agent is changed.

##### `DefaultArbiterSet(address indexed arbiter)`

Emitted when default arbiter is changed.

## PropertyEscrow Contract

### Overview
Individual escrow contracts that manage the complete property transaction lifecycle from deposit to fund release or dispute resolution.

### Interface: IPropertyEscrow

#### Functions

##### `depositFunds(uint256 escrowId)`

Deposits the required funds into the escrow contract.

**Parameters:**
- `escrowId` (uint256): Escrow identifier

**Requirements:**
- Caller must be the buyer
- Escrow must be in Created state
- Deposit deadline must not have passed
- Buyer must have approved sufficient token allowance
- Buyer must have sufficient token balance

**State Transition:**
- Created → Deposited

**Events Emitted:**
- `FundsDeposited(uint256 indexed escrowId, address indexed buyer, uint256 amount)`

##### `completeVerification(uint256 escrowId)`

Marks property verification as complete.

**Parameters:**
- `escrowId` (uint256): Escrow identifier

**Requirements:**
- Caller must be the assigned agent
- Escrow must be in Deposited state
- Verification deadline must not have passed

**State Transition:**
- Deposited → Verified

**Events Emitted:**
- `VerificationCompleted(uint256 indexed escrowId, address indexed verifier)`

##### `giveApproval(uint256 escrowId)`

Provides approval for fund release (buyer, seller, or agent).

**Parameters:**
- `escrowId` (uint256): Escrow identifier

**Requirements:**
- Caller must be buyer, seller, or agent
- Escrow must be in Verified state

**Events Emitted:**
- `ApprovalGiven(uint256 indexed escrowId, address indexed approver, Role role)`

##### `releaseFunds(uint256 escrowId)`

Releases funds to the seller when all conditions are met.

**Parameters:**
- `escrowId` (uint256): Escrow identifier

**Requirements:**
- Escrow must be in Verified state
- All required approvals must be given
- Release conditions must be met

**State Transition:**
- Verified → Released

**Events Emitted:**
- `FundsReleased(uint256 indexed escrowId, address indexed seller, uint256 amount)`

##### `raiseDispute(uint256 escrowId, string calldata reason)`

Initiates a dispute for the escrow.

**Parameters:**
- `escrowId` (uint256): Escrow identifier
- `reason` (string): Reason for the dispute

**Requirements:**
- Caller must be buyer, seller, or agent
- Escrow must be in Deposited or Verified state

**State Transition:**
- Deposited/Verified → Disputed

**Events Emitted:**
- `DisputeRaised(uint256 indexed escrowId, address indexed initiator, string reason)`

##### `resolveDispute(uint256 escrowId, bool favorBuyer, string calldata resolution)`

Resolves a dispute (arbiter only).

**Parameters:**
- `escrowId` (uint256): Escrow identifier
- `favorBuyer` (bool): Whether to favor the buyer (true) or seller (false)
- `resolution` (string): Resolution details

**Requirements:**
- Caller must be the assigned arbiter
- Escrow must be in Disputed state

**State Transition:**
- Disputed → Released (if favor seller) or Refunded (if favor buyer)

**Events Emitted:**
- `DisputeResolved(uint256 indexed escrowId, address indexed arbiter, string resolution)`

##### `refundBuyer(uint256 escrowId)`

Refunds the buyer (admin function).

**Parameters:**
- `escrowId` (uint256): Escrow identifier

**Requirements:**
- Caller must have ADMIN_ROLE
- Escrow must not be in Released state

**State Transition:**
- Any state → Refunded

**Events Emitted:**
- `FundsRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount)`

##### `cancelEscrow(uint256 escrowId)`

Cancels the escrow (before deposits).

**Parameters:**
- `escrowId` (uint256): Escrow identifier

**Requirements:**
- Caller must be seller or have ADMIN_ROLE
- Escrow must be in Created state

**State Transition:**
- Created → Cancelled

**Events Emitted:**
- `EscrowCancelled(uint256 indexed escrowId, address indexed canceller)`

#### View Functions

##### `getEscrow(uint256 escrowId) → Escrow memory`

Returns complete escrow details.

**Parameters:**
- `escrowId` (uint256): Escrow identifier

**Returns:**
- `Escrow`: Complete escrow data structure

##### `getEscrowState(uint256 escrowId) → EscrowState`

Returns current escrow state.

**Parameters:**
- `escrowId` (uint256): Escrow identifier

**Returns:**
- `EscrowState`: Current state enum value

##### `canReleaseFunds(uint256 escrowId) → bool`

Checks if funds can be released.

**Parameters:**
- `escrowId` (uint256): Escrow identifier

**Returns:**
- `bool`: True if release conditions are met

##### `getRequiredApprovals(uint256 escrowId) → (bool buyer, bool seller, bool agent)`

Returns approval status for all parties.

**Parameters:**
- `escrowId` (uint256): Escrow identifier

**Returns:**
- `buyer` (bool): Buyer approval status
- `seller` (bool): Seller approval status
- `agent` (bool): Agent approval status

## Data Structures

### CreateEscrowParams

```solidity
struct CreateEscrowParams {
    address buyer;                    // Buyer's wallet address
    address seller;                   // Seller's wallet address  
    address agent;                    // Agent's wallet address
    address arbiter;                  // Arbiter's wallet address
    address tokenAddress;             // ERC20 token for payment
    uint256 depositAmount;            // Amount to be deposited
    uint256 agentFee;                // Agent fee in basis points
    uint256 platformFee;             // Platform fee in basis points
    Property property;                // Property details
    uint256 depositDeadline;          // Deadline for deposit
    uint256 verificationDeadline;     // Deadline for verification
}
```

### Property

```solidity
struct Property {
    string propertyId;          // Unique property identifier
    string description;         // Property description
    uint256 salePrice;         // Total sale price in tokens
    string documentHash;       // IPFS hash of property documents
    bool verified;             // Whether property verification is complete
}
```

### Escrow

```solidity
struct Escrow {
    uint256 id;                    // Unique escrow ID
    address buyer;                 // Buyer's address
    address seller;                // Seller's address
    address agent;                 // Agent's address
    address arbiter;               // Arbiter's address
    address tokenAddress;          // Payment token address
    uint256 depositAmount;         // Deposited amount
    uint256 agentFee;             // Agent fee amount
    uint256 platformFee;          // Platform fee amount
    Property property;            // Property information
    EscrowState state;            // Current escrow state
    uint256 depositDeadline;      // Deadline for deposit
    uint256 verificationDeadline; // Deadline for verification
    bool buyerApproval;           // Buyer's approval for release
    bool sellerApproval;          // Seller's approval for release
    bool agentApproval;           // Agent's approval for release
    string disputeReason;         // Reason for dispute if any
}
```

### EscrowState

```solidity
enum EscrowState {
    Created,        // Escrow created but no deposit yet
    Deposited,      // Funds deposited, awaiting verification
    Verified,       // Verification complete, awaiting release
    Released,       // Funds released to seller
    Disputed,       // Dispute raised, awaiting resolution
    Refunded,       // Funds refunded to buyer
    Cancelled       // Escrow cancelled
}
```

### Role

```solidity
enum Role {
    Buyer,
    Seller,
    Agent,
    Admin,
    Arbiter
}
```

## Error Handling

### Common Errors

#### Access Control Errors
- `OwnableUnauthorizedAccount(address account)`: Caller is not the owner
- `AccessControlUnauthorizedAccount(address account, bytes32 role)`: Caller lacks required role

#### State Errors
- `"Invalid escrow state"`: Operation not allowed in current state
- `"Escrow not found"`: Invalid escrow ID provided
- `"Release conditions not met"`: Cannot release funds yet

#### Validation Errors
- `"Invalid deposit amount"`: Amount is zero or invalid
- `"Invalid token address"`: Token not whitelisted or zero address
- `"Deadline passed"`: Operation deadline has expired
- `"Insufficient balance"`: Caller has insufficient token balance
- `"Insufficient allowance"`: Caller has not approved enough tokens

#### Business Logic Errors
- `"Not authorized"`: Caller is not authorized for this operation
- `"Already approved"`: Approval already given by this party
- `"Dispute already exists"`: Cannot raise duplicate dispute

## Integration Examples

### JavaScript/TypeScript Integration

```javascript
import { ethers } from 'ethers';

// Contract setup
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = provider.getSigner();
const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

// Create escrow
async function createEscrow(params) {
    try {
        const tx = await factoryContract.createEscrow(params);
        const receipt = await tx.wait();
        
        // Extract escrow ID from events
        const event = receipt.events.find(e => e.event === 'EscrowCreated');
        const escrowId = event.args.escrowId;
        
        return { escrowId, escrowContract: event.args.escrowContract };
    } catch (error) {
        console.error('Error creating escrow:', error);
        throw error;
    }
}

// Monitor escrow state
async function monitorEscrow(escrowAddress) {
    const escrowContract = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
    
    escrowContract.on("FundsDeposited", (escrowId, buyer, amount) => {
        console.log(`Funds deposited: ${amount} by ${buyer}`);
    });
    
    escrowContract.on("VerificationCompleted", (escrowId, verifier) => {
        console.log(`Property verified by ${verifier}`);
    });
    
    escrowContract.on("FundsReleased", (escrowId, seller, amount) => {
        console.log(`Funds released: ${amount} to ${seller}`);
    });
}
```

### Web3.js Integration

```javascript
import Web3 from 'web3';

const web3 = new Web3(window.ethereum);
const factoryContract = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS);

// Create escrow with Web3
async function createEscrowWeb3(params, fromAddress) {
    return await factoryContract.methods.createEscrow(params)
        .send({ from: fromAddress, gas: 500000 });
}

// Get escrow details
async function getEscrowDetails(escrowAddress, escrowId) {
    const escrowContract = new web3.eth.Contract(ESCROW_ABI, escrowAddress);
    return await escrowContract.methods.getEscrow(escrowId).call();
}
```

## Gas Estimates

### Function Gas Costs (Approximate)

| Function | Gas Cost | Notes |
|----------|----------|-------|
| `createEscrow()` | ~800,000 | Includes contract deployment |
| `depositFunds()` | ~150,000 | ERC20 transfer included |
| `completeVerification()` | ~50,000 | State change only |
| `giveApproval()` | ~45,000 | State change only |
| `releaseFunds()` | ~200,000 | Multiple transfers |
| `raiseDispute()` | ~60,000 | String storage |
| `resolveDispute()` | ~180,000 | Resolution logic |

### Optimization Tips

1. **Batch Operations**: Use multicall patterns for multiple operations
2. **Gas Price**: Monitor network conditions for optimal gas pricing
3. **State Packing**: Struct packing optimizes storage reads/writes
4. **Event Monitoring**: Use events instead of constant state queries

## Rate Limits and Best Practices

### Transaction Ordering

1. Token approval before deposit
2. Verification before approvals
3. All approvals before fund release

### Security Considerations

1. **Always validate inputs** before calling contract functions
2. **Check contract state** before operations
3. **Monitor events** for transaction confirmation
4. **Handle revert cases** gracefully in your application

### Production Deployment

1. **Test on Mumbai** before mainnet deployment
2. **Verify contracts** on Polygonscan
3. **Set up monitoring** for critical events
4. **Implement circuit breakers** for emergency situations

## Support and Resources

- **Contract Source**: GitHub repository
- **Verification**: Polygonscan verified contracts
- **Support**: Developer Discord channel
- **Updates**: Follow project announcements