# Enterprise Property Escrow Platform - Quick Start Guide

## Prerequisites

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **MetaMask** - [Install browser extension](https://metamask.io/)

### System Requirements
- RAM: 4GB minimum, 8GB recommended
- Storage: 2GB free space
- Operating System: Windows 10+, macOS 10.15+, Ubuntu 20.04+

## Installation Steps

### 1. Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/your-org/enterprise-escrow-platform.git
cd enterprise-escrow-platform

# Install dependencies
npm install

# Verify installation
npx hardhat --version
```

### 2. Compile Smart Contracts

```bash
# Compile all contracts
npx hardhat compile

# Expected output:
# Compiled 24 Solidity files successfully
```

### 3. Start Local Development Environment

Open three terminal windows:

**Terminal 1 - Local Blockchain:**
```bash
npx hardhat node
```
Keep this running. You'll see 20 test accounts with 10,000 ETH each.

**Terminal 2 - Deploy Contracts:**
```bash
# Wait for blockchain to start, then deploy
npx hardhat run scripts/deploy.js --network localhost

# Expected output:
# EscrowFactory deployed to: 0x...
# Setup completed successfully
```

**Terminal 3 - Start Frontend:**
```bash
cd frontend
npm install
npm start
```

Your application will be available at http://localhost:5000

### 4. Configure MetaMask

1. **Add Local Network:**
   - Open MetaMask → Networks → Add Network
   - Network Name: `Hardhat Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Test Account:**
   - Copy a private key from Terminal 1 output
   - MetaMask → Import Account → Enter private key
   - Switch to this account

### 5. Verify Setup

```bash
# Test smart contracts
npx hardhat test test/PropertyEscrow.test.js

# Test frontend
cd frontend && npm test -- --watchAll=false

# Expected: All tests passing
```

## Basic Usage

### Creating Your First Escrow

1. **Open Application:** Navigate to http://localhost:5000
2. **Connect Wallet:** Click "Connect Wallet" and approve MetaMask connection
3. **Create Escrow:** 
   - Fill property details (name, address, price)
   - Set buyer and seller addresses
   - Optionally add agent and arbiter
   - Click "Create Escrow"
4. **Confirm Transaction:** Approve in MetaMask

### Making a Deposit

1. **Find Your Escrow:** View created escrows on dashboard
2. **Click "Deposit":** Enter deposit amount
3. **Confirm:** Approve transaction in MetaMask
4. **Verify:** Check escrow status updates to "Funded"

### Testing Complete Flow

Run the interactive demo:
```bash
# In a new terminal (keep others running)
node cli-demo.js
```

Follow the prompts to:
- Create test escrow
- Make deposits
- Approve releases
- Handle disputes

## Development Workflow

### Running Tests

```bash
# Smart contract tests
npx hardhat test                    # All tests
npx hardhat test --grep "Factory"   # Specific tests
npx hardhat coverage               # With coverage

# Frontend tests
cd frontend
npm run test:ui                    # UI components
npm run test:a11y                  # Accessibility
npm run test:coverage              # Coverage report
```

### Code Quality

```bash
# Lint smart contracts
npx hardhat run scripts/lint.js

# Check security
npx hardhat run security-analysis.js

# Format code
npm run prettier
```

### Hot Reload Development

- **Smart Contracts:** Recompile with `npx hardhat compile`
- **Frontend:** Auto-reloads on file changes
- **Tests:** Use `--watch` flag for continuous testing

## Common Commands

### Project Management
```bash
npm install                        # Install dependencies
npm run clean                      # Clean cache and artifacts
npm run build                      # Build production ready app
```

### Testing
```bash
npx hardhat test                   # Run all contract tests
npm run test:frontend              # Run all UI tests
npm run test:coverage              # Generate coverage reports
```

### Deployment
```bash
npx hardhat run scripts/deploy.js --network localhost  # Local
npx hardhat run scripts/deploy.js --network polygon    # Polygon
```

### Utilities
```bash
node cli-demo.js                   # Interactive demo
npx hardhat node                   # Start local blockchain
npx hardhat clean                  # Clear cache
```

## Verification Checklist

Before proceeding with development, verify:

- [ ] All dependencies installed without errors
- [ ] Smart contracts compile successfully
- [ ] Local blockchain starts and shows 20 accounts
- [ ] Contracts deploy without errors
- [ ] Frontend starts on port 5000
- [ ] MetaMask connects to local network
- [ ] Test account imported with ETH balance
- [ ] Basic tests pass (contracts and frontend)
- [ ] Can create and interact with escrow in UI

## Next Steps

1. **Explore the Platform:** Try creating different escrow scenarios
2. **Review Documentation:** Check the main README for advanced features
3. **Run Full Test Suite:** Execute comprehensive tests
4. **Customize Configuration:** Modify settings for your use case
5. **Deploy to Testnet:** When ready, deploy to Polygon testnet

## Getting Help

If you encounter issues:

1. **Check Terminal Output:** Look for specific error messages
2. **Review Troubleshooting:** See README troubleshooting section
3. **Verify Prerequisites:** Ensure Node.js 18+ and all dependencies
4. **Clean Install:** Remove `node_modules` and reinstall
5. **Check Network:** Ensure MetaMask is on correct network

For persistent issues, refer to the comprehensive troubleshooting guide in README.md or create an issue in the repository.