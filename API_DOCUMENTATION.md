# Enterprise Property Escrow Platform - API Documentation

## Overview

The Enterprise Property Escrow Platform provides both smart contract APIs and frontend interfaces for managing property escrow transactions on the Polygon blockchain.

## Smart Contract API

### EscrowFactory Contract

The factory contract manages escrow creation and global platform settings.

#### Core Functions

##### createEscrow()
Creates a new property escrow contract.

```solidity
function createEscrow(
    CreateEscrowParams calldata params
) external returns (address escrowContract, uint256 escrowId)
```

**Parameters:**
- `params.buyer` (address): Buyer's wallet address
- `params.seller` (address): Seller's wallet address
- `params.agent` (address): Optional agent address
- `params.arbiter` (address): Optional arbiter address
- `params.tokenContract` (address): ERC20 token for payments
- `params.escrowAmount` (uint256): Total escrow amount
- `params.agentFee` (uint256): Agent fee percentage (basis points)
- `params.platformFee` (uint256): Platform fee percentage (basis points)
- `params.propertyId` (string): Unique property identifier

**Returns:**
- `escrowContract`: Address of created escrow contract
- `escrowId`: Unique escrow identifier

**Events:**
```solidity
event EscrowCreated(
    uint256 indexed escrowId,
    address indexed escrowContract,
    address indexed buyer,
    address seller,
    uint256 escrowAmount
);
```

##### whitelistToken()
Manages token whitelist for platform payments.

```solidity
function whitelistToken(address token, bool whitelisted) external onlyOwner
```

**Parameters:**
- `token`: ERC20 token contract address
- `whitelisted`: True to whitelist, false to remove

##### getEscrowContract()
Retrieves escrow contract address by ID.

```solidity
function getEscrowContract(uint256 escrowId) external view returns (address)
```

##### isTokenWhitelisted()
Checks if token is approved for platform use.

```solidity
function isTokenWhitelisted(address token) external view returns (bool)
```

### PropertyEscrow Contract

Individual escrow contracts manage specific property transactions.

#### State Management

##### deposit()
Buyer deposits funds into escrow.

```solidity
function deposit() external payable
```

**Requirements:**
- Caller must be buyer
- Escrow must be in Created state
- Amount must equal escrowAmount

**Events:**
```solidity
event FundsDeposited(
    address indexed buyer,
    uint256 amount,
    uint256 timestamp
);
```

##### approveRelease()
Party approves fund release to seller.

```solidity
function approveRelease() external
```

**Requirements:**
- Caller must be buyer, seller, or agent
- Escrow must be in Deposited state

**Events:**
```solidity
event ReleaseApproved(
    address indexed approver,
    uint256 timestamp
);
```

##### releaseFunds()
Releases funds to seller when conditions are met.

```solidity
function releaseFunds() external
```

**Requirements:**
- Sufficient approvals received
- Escrow must be in Deposited state

**Events:**
```solidity
event FundsReleased(
    address indexed seller,
    uint256 amount,
    uint256 agentFee,
    uint256 platformFee
);
```

##### initiateDispute()
Starts dispute resolution process.

```solidity
function initiateDispute(string calldata reason) external
```

**Parameters:**
- `reason`: Description of dispute

**Requirements:**
- Caller must be buyer or seller
- Escrow must be in Deposited state

##### resolveDispute()
Arbiter resolves dispute and determines fund distribution.

```solidity
function resolveDispute(
    uint256 buyerAmount,
    uint256 sellerAmount,
    string calldata resolution
) external onlyArbiter
```

**Parameters:**
- `buyerAmount`: Amount to refund buyer
- `sellerAmount`: Amount to release to seller
- `resolution`: Dispute resolution details

##### cancelEscrow()
Cancels escrow and refunds buyer (if applicable).

```solidity
function cancelEscrow() external
```

**Requirements:**
- Caller must be buyer or seller
- Escrow must be in Created or Deposited state

#### View Functions

##### getEscrowDetails()
Returns complete escrow information.

```solidity
function getEscrowDetails() external view returns (EscrowDetails memory)
```

**Returns:**
```solidity
struct EscrowDetails {
    address buyer;
    address seller;
    address agent;
    address arbiter;
    address tokenContract;
    uint256 escrowAmount;
    uint256 agentFee;
    uint256 platformFee;
    EscrowStatus status;
    string propertyId;
    uint256 createdAt;
    uint256 depositedAt;
    uint256 releasedAt;
}
```

##### getApprovals()
Returns current approval status.

```solidity
function getApprovals() external view returns (ApprovalStatus memory)
```

##### getDisputeInfo()
Returns dispute information if applicable.

```solidity
function getDisputeInfo() external view returns (DisputeInfo memory)
```

## Frontend API

### Wallet Integration

#### useWallet Hook
Custom React hook for wallet connectivity.

```typescript
const {
  account,
  isConnected,
  connect,
  disconnect,
  switchNetwork,
  balance
} = useWallet();
```

**Properties:**
- `account`: Connected wallet address
- `isConnected`: Connection status
- `balance`: Wallet balance in ETH

**Methods:**
- `connect()`: Initiates MetaMask connection
- `disconnect()`: Disconnects wallet
- `switchNetwork(chainId)`: Switches to specified network

### Escrow Management

#### useEscrow Hook
Manages escrow contract interactions.

```typescript
const {
  createEscrow,
  depositFunds,
  approveRelease,
  releaseFunds,
  initiateDispute,
  cancelEscrow,
  getEscrowDetails
} = useEscrow();
```

#### createEscrow()
Creates new property escrow.

```typescript
interface CreateEscrowParams {
  buyer: string;
  seller: string;
  agent?: string;
  arbiter?: string;
  tokenContract: string;
  escrowAmount: string;
  agentFee: number;
  propertyId: string;
}

const result = await createEscrow(params);
```

#### depositFunds()
Deposits funds into existing escrow.

```typescript
const txHash = await depositFunds(escrowId, amount);
```

#### approveRelease()
Approves fund release.

```typescript
const txHash = await approveRelease(escrowId);
```

### Error Handling

#### Error Types

```typescript
enum ErrorType {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

interface EscrowError {
  type: ErrorType;
  message: string;
  details?: any;
}
```

#### Error Handling Pattern

```typescript
try {
  const result = await createEscrow(params);
  setEscrow(result);
} catch (error) {
  if (error.type === ErrorType.WALLET_NOT_CONNECTED) {
    showConnectWalletModal();
  } else if (error.type === ErrorType.INSUFFICIENT_BALANCE) {
    showInsufficientFundsAlert();
  } else {
    showGenericError(error.message);
  }
}
```

## Event Handling

### Contract Events

#### EscrowCreated
Emitted when new escrow is created.

```solidity
event EscrowCreated(
    uint256 indexed escrowId,
    address indexed escrowContract,
    address indexed buyer,
    address seller,
    uint256 escrowAmount
);
```

#### FundsDeposited
Emitted when buyer deposits funds.

```solidity
event FundsDeposited(
    address indexed buyer,
    uint256 amount,
    uint256 timestamp
);
```

#### FundsReleased
Emitted when funds are released to seller.

```solidity
event FundsReleased(
    address indexed seller,
    uint256 amount,
    uint256 agentFee,
    uint256 platformFee
);
```

### Frontend Event Listeners

```typescript
useEffect(() => {
  const contract = getEscrowContract(escrowId);
  
  contract.on('FundsDeposited', (buyer, amount, timestamp) => {
    updateEscrowStatus('Deposited');
    showNotification('Funds deposited successfully');
  });
  
  contract.on('FundsReleased', (seller, amount, agentFee, platformFee) => {
    updateEscrowStatus('Released');
    showNotification('Funds released to seller');
  });
  
  return () => {
    contract.removeAllListeners();
  };
}, [escrowId]);
```

## Gas Optimization

### Estimated Gas Costs

| Function | Gas Cost (approx) | USD Cost* |
|----------|------------------|-----------|
| createEscrow | 800,000 | $0.02 |
| deposit | 100,000 | $0.003 |
| approveRelease | 80,000 | $0.002 |
| releaseFunds | 120,000 | $0.003 |
| initiateDispute | 90,000 | $0.002 |

*Based on 30 gwei gas price and $1,800 ETH

### Gas Optimization Tips

1. **Batch Operations**: Combine multiple approvals in single transaction
2. **State Packing**: Struct packing reduces storage costs
3. **Event Optimization**: Use indexed parameters efficiently
4. **Minimal Storage**: Store only essential data on-chain

## Security Considerations

### Access Control

```solidity
modifier onlyBuyer() {
    require(msg.sender == buyer, "Only buyer allowed");
    _;
}

modifier onlyParties() {
    require(
        msg.sender == buyer || 
        msg.sender == seller || 
        msg.sender == agent,
        "Only escrow parties allowed"
    );
    _;
}
```

### Reentrancy Protection

```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PropertyEscrow is ReentrancyGuard {
    function releaseFunds() external nonReentrant {
        // Safe fund transfer logic
    }
}
```

### Input Validation

```solidity
require(escrowAmount > 0, "Escrow amount must be positive");
require(buyer != seller, "Buyer and seller must be different");
require(tokenContract != address(0), "Invalid token contract");
```

## Rate Limits and Throttling

### Frontend Rate Limits

- **Transaction Submission**: 1 per block (~2 seconds)
- **Contract Queries**: 100 per minute
- **Event Subscriptions**: 10 concurrent connections

### Best Practices

```typescript
// Debounce frequent operations
const debouncedSearch = useMemo(
  () => debounce(searchEscrows, 300),
  []
);

// Cache contract instances
const contractCache = new Map();
const getContract = (address) => {
  if (!contractCache.has(address)) {
    contractCache.set(address, new ethers.Contract(address, abi, provider));
  }
  return contractCache.get(address);
};
```

## Testing API

### Mock Contracts

```typescript
// For testing purposes
const mockEscrowFactory = {
  createEscrow: jest.fn().mockResolvedValue({
    escrowContract: '0x123...',
    escrowId: 1
  }),
  getEscrowContract: jest.fn().mockReturnValue('0x123...'),
  isTokenWhitelisted: jest.fn().mockReturnValue(true)
};
```

### Test Utilities

```typescript
export const testUtils = {
  setupTestEscrow: async () => {
    // Create test escrow with predefined parameters
  },
  
  mockWalletConnection: (account: string) => {
    // Mock wallet connection for testing
  },
  
  advanceBlockTime: async (seconds: number) => {
    // Advance blockchain time for testing
  }
};
```

## Migration and Upgrades

### Contract Upgrades

The platform uses OpenZeppelin's upgradeable contracts pattern:

```solidity
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract EscrowFactoryUpgradeable is 
    Initializable, 
    OwnableUpgradeable 
{
    function initialize(address _platformWallet) public initializer {
        __Ownable_init();
        platformWallet = _platformWallet;
    }
}
```

### Deployment Scripts

```javascript
// Upgrade existing contract
const { ethers, upgrades } = require("hardhat");

async function upgrade() {
  const EscrowFactoryV2 = await ethers.getContractFactory("EscrowFactoryV2");
  await upgrades.upgradeProxy(proxyAddress, EscrowFactoryV2);
}
```

## Monitoring and Analytics

### Contract Monitoring

```typescript
// Monitor contract events
const monitorEscrows = () => {
  factory.on('EscrowCreated', (escrowId, contract, buyer, seller, amount) => {
    analytics.track('Escrow Created', {
      escrowId,
      amount: ethers.utils.formatEther(amount)
    });
  });
};
```

### Performance Metrics

- **Transaction Success Rate**: >99%
- **Average Gas Cost**: <100,000 gas
- **Block Confirmation Time**: ~2-3 blocks
- **Frontend Load Time**: <2 seconds

## Support and Resources

### Documentation Links

- [Smart Contract Source Code](./contracts/)
- [Frontend Components](./frontend/src/components/)
- [Test Suites](./test/)
- [Security Audit](./audit-bundle/)

### Community Resources

- GitHub Issues: Technical support and bug reports
- Discord: Community discussions
- Documentation: Comprehensive guides and tutorials

### Emergency Procedures

In case of critical issues:

1. **Pause Contracts**: Use emergency pause function
2. **Notify Users**: Display maintenance banner
3. **Investigate**: Analyze logs and transactions
4. **Deploy Fix**: Test and deploy resolution
5. **Resume Operations**: Remove pause and notify users