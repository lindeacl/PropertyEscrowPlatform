# PropertyEscrow Platform

A blockchain-powered property escrow platform that simplifies complex real estate transactions through advanced smart contract infrastructure and user-friendly design.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git
- MetaMask browser extension (for Web3 functionality)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd PropertyEscrowPlatform
```

2. **Install dependencies**
```bash
npm install
cd frontend && npm install
```

3. **Start local blockchain**
```bash
npx hardhat node
```

4. **Deploy contracts** (in new terminal)
```bash
npx hardhat run scripts/deploy.js --network localhost
```

5. **Start frontend development server**
```bash
cd frontend && npm start
```

6. **Access the application**
- Web Interface: http://localhost:5000
- CLI Demo: `node cli-demo.js`

### MetaMask Setup

1. Install MetaMask browser extension
2. Add localhost network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

3. Import test account using private key from Hardhat node output

## 🏗 Architecture

### Smart Contracts

- **EscrowFactory**: Creates and manages property escrow contracts
- **PropertyEscrow**: Individual escrow instances with multi-party support
- **MockERC20**: Test token for development and testing

### Frontend Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-based page components
│   ├── contexts/       # React contexts (Wallet, Theme)
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions and helpers
│   └── __tests__/      # Test files
```

## 🔧 Development

### Running Tests

**Smart Contract Tests:**
```bash
npx hardhat test
```

**Frontend Tests:**
```bash
cd frontend && npm test
```

**Test Coverage:**
```bash
npx hardhat coverage
cd frontend && npm test -- --coverage
```

**CLI Demo:**
```bash
node cli-demo.js
```

### Development Workflows

1. **Contract Development**
   - Modify contracts in `contracts/`
   - Run tests: `npx hardhat test`
   - Deploy: `npx hardhat run scripts/deploy.js --network localhost`

2. **Frontend Development**
   - Start dev server: `cd frontend && npm start`
   - Run tests: `npm test`
   - Build production: `npm run build`

## 📋 Features

### Core Functionality

- **Escrow Creation**: Multi-party property escrow setup
- **Fund Management**: Secure deposit, approval, and release
- **Dispute Resolution**: Built-in arbitration system
- **Wallet Integration**: MetaMask and Web3 wallet support
- **Real-time Updates**: Live transaction status monitoring

### Security Features

- **Smart Contract Auditing**: Comprehensive test coverage
- **Role-based Access**: Buyer, seller, agent, arbiter permissions
- **Time-locked Transactions**: Deadline enforcement
- **Emergency Controls**: Cancel and dispute mechanisms

## 🧪 Testing

### Test Categories

1. **Unit Tests**: Individual component functionality
2. **Integration Tests**: Cross-component interactions
3. **Contract Tests**: Smart contract behavior validation
4. **E2E Tests**: Complete user workflows
5. **Accessibility Tests**: WCAG compliance verification

### Running Specific Tests

```bash
# Smart contract tests only
npx hardhat test test/Core.test.js

# Frontend component tests
cd frontend && npm test -- --testPathPattern=components

# Coverage with threshold enforcement
npx hardhat coverage --solcoverjs .solcover.js
```

## 🔐 Security

### Smart Contract Security

- Reentrancy protection with OpenZeppelin ReentrancyGuard
- Access control with role-based permissions
- Input validation and overflow protection
- Emergency pause functionality

### Frontend Security

- Input sanitization and validation
- Secure wallet connection handling
- Error boundary implementation
- XSS protection measures

## 🌐 Deployment

### Local Development

1. Start Hardhat network: `npx hardhat node`
2. Deploy contracts: `npm run deploy:localhost`
3. Start frontend: `cd frontend && npm start`

### Production Deployment

1. Configure environment variables
2. Deploy contracts to target network
3. Build frontend: `cd frontend && npm run build`
4. Deploy static assets to hosting platform

## 🔧 Troubleshooting

### Common Issues

**MetaMask Connection Errors**
- Ensure MetaMask is installed and unlocked
- Verify network configuration (Chain ID: 31337)
- Reset MetaMask account if transaction nonce issues occur

**Port Conflicts**
- Frontend (5000): Change PORT in frontend/.env
- Hardhat (8545): Modify hardhat.config.js networks settings
- Check for other applications using these ports

**Contract Deployment Failures**
- Verify Hardhat network is running
- Check account has sufficient ETH for deployment
- Ensure contract compilation succeeds: `npx hardhat compile`

**Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Verify Node.js version compatibility (18+)
- Check for TypeScript errors: `npx tsc --noEmit`

### Node Version Issues

This project requires Node.js 18 or higher. Use nvm to manage versions:

```bash
nvm install 18
nvm use 18
```

### Missing Environment Configuration

Create `.env` files based on `.env.example`:

```bash
cp .env.example .env
cd frontend && cp .env.example .env
```

### Contract Interaction Errors

- Verify contract addresses match deployed instances
- Check ABI files are up to date after redeployment
- Ensure correct network selection in MetaMask

### Performance Issues

- Enable hardware acceleration in browser
- Close unnecessary browser tabs
- Monitor system memory usage during development

## 📖 API Documentation

### Smart Contract Interface

**EscrowFactory**
- `createEscrow()`: Create new escrow instance
- `getEscrowsByParty()`: Get escrows for specific address
- `whitelistToken()`: Add token to approved list

**PropertyEscrow**
- `deposit()`: Deposit funds into escrow
- `approve()`: Approve fund release
- `release()`: Release funds to seller
- `cancel()`: Cancel escrow transaction

### Frontend Hooks

**useWallet**
- Wallet connection management
- Account and balance tracking
- Network switching utilities

**useEscrow**
- Escrow data fetching
- Transaction state management
- Contract interaction methods

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

### Development Standards

- Write comprehensive tests for new features
- Follow TypeScript strict mode guidelines
- Maintain >90% test coverage
- Document public API changes
- Follow conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support and questions:

1. Check this README and troubleshooting section
2. Review existing GitHub issues
3. Create new issue with detailed description
4. Include system information and error logs

## 📊 Project Status

- ✅ Smart contracts deployed and tested
- ✅ Frontend core functionality complete
- ✅ CLI demo operational
- ✅ Local development environment
- 🔄 Production deployment pipeline
- 🔄 Comprehensive documentation
- 🔄 Advanced security auditing