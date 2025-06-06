# Enterprise Property Escrow Platform - Deployment Guide

## Overview

This guide covers deploying the Enterprise Property Escrow Platform to various environments, from local development to production deployment on Polygon mainnet.

## Deployment Environments

### 1. Local Development
- **Purpose**: Development and testing
- **Network**: Hardhat local blockchain
- **Requirements**: Node.js, MetaMask
- **Cost**: Free

### 2. Polygon Mumbai Testnet
- **Purpose**: Pre-production testing
- **Network**: Polygon Mumbai
- **Requirements**: Mumbai MATIC tokens
- **Cost**: Free testnet tokens

### 3. Polygon Mainnet
- **Purpose**: Production deployment
- **Network**: Polygon mainnet
- **Requirements**: Real MATIC tokens
- **Cost**: Transaction fees in MATIC

## Prerequisites

### Required Tools
```bash
# Verify installations
node --version          # Should be 18+
npm --version          # Should be 8+
npx hardhat --version  # Should be latest
```

### Environment Configuration

Create environment files:

**.env.development**
```bash
# Local development
HARDHAT_NETWORK=localhost
RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETHERSCAN_API_KEY=your_polygonscan_api_key
```

**.env.testnet**
```bash
# Mumbai testnet
HARDHAT_NETWORK=mumbai
RPC_URL=https://rpc-mumbai.polygon.technology
PRIVATE_KEY=your_testnet_private_key
ETHERSCAN_API_KEY=your_polygonscan_api_key
```

**.env.production**
```bash
# Polygon mainnet
HARDHAT_NETWORK=polygon
RPC_URL=https://rpc.polygon.technology
PRIVATE_KEY=your_production_private_key
ETHERSCAN_API_KEY=your_polygonscan_api_key
```

## Local Deployment

### Step 1: Start Local Environment

```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Start frontend
cd frontend && npm start
```

### Step 2: Verify Local Deployment

```bash
# Test contract deployment
npx hardhat test test/deployment.test.js --network localhost

# Check frontend connection
curl http://localhost:5000
```

## Testnet Deployment (Polygon Mumbai)

### Step 1: Setup Mumbai Network

Add Mumbai network to Hardhat config:

```javascript
// hardhat.config.js
networks: {
  mumbai: {
    url: process.env.RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 80001,
    gasPrice: 35000000000
  }
}
```

### Step 2: Get Test Tokens

1. **Get Mumbai MATIC**: https://faucet.polygon.technology/
2. **Verify Balance**: Check your wallet has sufficient MATIC

### Step 3: Deploy to Mumbai

```bash
# Deploy contracts
npx hardhat run scripts/deploy.js --network mumbai

# Verify deployment
npx hardhat verify --network mumbai <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Step 4: Update Frontend Configuration

```javascript
// frontend/src/config/networks.js
export const NETWORKS = {
  mumbai: {
    chainId: 80001,
    name: 'Polygon Mumbai',
    rpc: 'https://rpc-mumbai.polygon.technology',
    factoryAddress: 'YOUR_DEPLOYED_FACTORY_ADDRESS'
  }
}
```

## Production Deployment (Polygon Mainnet)

### Step 1: Security Checklist

- [ ] Smart contracts audited by security firm
- [ ] All tests passing with >95% coverage
- [ ] Security analysis shows zero vulnerabilities
- [ ] Frontend penetration testing completed
- [ ] Environment variables secured
- [ ] Multi-signature wallet setup for admin functions

### Step 2: Pre-deployment Validation

```bash
# Run comprehensive test suite
npm run test:comprehensive

# Security analysis
npm run security:analysis

# Gas optimization check
npx hardhat test --gas-reporter
```

### Step 3: Deploy to Mainnet

```bash
# Compile for production
npx hardhat compile

# Deploy with gas optimization
npx hardhat run scripts/deploy-production.js --network polygon

# Verify contracts on Polygonscan
npx hardhat verify --network polygon <FACTORY_ADDRESS>
npx hardhat verify --network polygon <TOKEN_ADDRESS>
```

### Step 4: Frontend Production Build

```bash
cd frontend

# Build production bundle
npm run build

# Optimize assets
npm run optimize

# Deploy to hosting service (Vercel/Netlify/AWS)
```

## Contract Verification

### Automatic Verification

```bash
# Verify factory contract
npx hardhat verify --network polygon \
  0xYourFactoryAddress \
  "0xPlatformWalletAddress" \
  100

# Verify with constructor arguments file
npx hardhat verify --network polygon \
  --constructor-args arguments.js \
  0xYourContractAddress
```

### Manual Verification

1. Go to [Polygonscan](https://polygonscan.com)
2. Search for your contract address
3. Click "Contract" → "Verify and Publish"
4. Select compiler version and settings
5. Paste flattened contract source

## Frontend Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Configure project
cd frontend
vercel

# Deploy
vercel --prod
```

### Netlify Deployment

```bash
# Build project
npm run build

# Deploy to Netlify
# Upload build/ folder to Netlify dashboard
```

### AWS S3 + CloudFront

```bash
# Build and sync to S3
npm run build
aws s3 sync build/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Post-Deployment Configuration

### 1. Update Contract Addresses

Update frontend configuration with deployed addresses:

```javascript
// frontend/src/config/contracts.js
export const CONTRACT_ADDRESSES = {
  polygon: {
    factory: '0xDeployedFactoryAddress',
    tokens: {
      USDC: '0xUSDCAddress',
      USDT: '0xUSDTAddress'
    }
  }
}
```

### 2. Configure Monitoring

Set up monitoring for:
- Contract events and transactions
- Frontend error tracking
- Performance monitoring
- Security incident detection

### 3. Set Up Analytics

```javascript
// Add analytics tracking
import { Analytics } from '@vercel/analytics/react'

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  )
}
```

## Security Considerations

### Smart Contract Security

1. **Access Control**: Verify admin functions are properly protected
2. **Reentrancy Protection**: Ensure all state changes follow CEI pattern
3. **Integer Overflow**: Use SafeMath or Solidity 0.8+ built-in protection
4. **Emergency Pause**: Implement pause functionality for emergencies

### Frontend Security

1. **Environment Variables**: Never expose private keys in frontend
2. **API Security**: Validate all user inputs
3. **CSP Headers**: Configure Content Security Policy
4. **HTTPS**: Ensure all connections use HTTPS

### Operational Security

1. **Multi-sig Wallets**: Use multi-signature wallets for admin functions
2. **Key Management**: Store private keys in hardware wallets
3. **Access Control**: Limit deployment access to authorized personnel
4. **Monitoring**: Set up alerts for unusual activity

## Monitoring and Maintenance

### Health Checks

```bash
# Contract health check
npx hardhat run scripts/health-check.js --network polygon

# Frontend health check
curl -f https://your-domain.com/api/health
```

### Performance Monitoring

- **Contract Gas Usage**: Monitor transaction costs
- **Frontend Performance**: Track Core Web Vitals
- **API Response Times**: Monitor backend performance
- **Error Rates**: Track and alert on errors

### Regular Maintenance

1. **Dependency Updates**: Keep packages updated
2. **Security Patches**: Apply security updates promptly
3. **Performance Optimization**: Regular performance reviews
4. **Backup Strategy**: Maintain secure backups

## Rollback Procedures

### Contract Rollback

```bash
# Deploy previous version
npx hardhat run scripts/deploy-rollback.js --network polygon

# Update frontend configuration
# Notify users of the change
```

### Frontend Rollback

```bash
# Vercel rollback
vercel rollback

# Manual rollback
git revert HEAD
npm run build
# Redeploy
```

## Cost Estimation

### Deployment Costs (Polygon Mainnet)

- **Factory Contract**: ~0.05 MATIC
- **Initial Configuration**: ~0.02 MATIC
- **Frontend Hosting**: $0-20/month (depending on traffic)
- **Domain & SSL**: $10-50/year

### Operational Costs

- **Transaction Fees**: ~0.001 MATIC per transaction
- **Monitoring**: $20-100/month
- **Maintenance**: Variable based on usage

## Support and Documentation

### Deployment Support

- **Technical Documentation**: See README.md
- **API Documentation**: See docs/API.md
- **Security Audit**: See audit-bundle/
- **Issue Tracking**: GitHub Issues

### Emergency Contacts

- **Technical Lead**: [contact info]
- **Security Team**: [contact info]
- **DevOps Team**: [contact info]

## Conclusion

This deployment guide provides comprehensive instructions for deploying the Enterprise Property Escrow Platform across all environments. Follow security best practices and thoroughly test each deployment before proceeding to production.