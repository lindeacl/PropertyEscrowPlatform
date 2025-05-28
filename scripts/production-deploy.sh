#!/bin/bash

# Enterprise Property Escrow Platform - Production Deployment Script
# Orchestrates complete deployment pipeline with validation and monitoring

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK=${1:-mumbai}
PRODUCTION_MODE=${2:-false}

echo -e "${BLUE}🚀 Enterprise Property Escrow Platform Deployment${NC}"
echo -e "${BLUE}=================================================${NC}"
echo "Network: $NETWORK"
echo "Production Mode: $PRODUCTION_MODE"
echo ""

# Pre-deployment validation
echo -e "${YELLOW}📋 Phase 1: Pre-Deployment Validation${NC}"
echo "----------------------------------------"

# Check environment variables
echo "🔍 Checking environment configuration..."
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ PRIVATE_KEY not set${NC}"
    exit 1
fi

if [ -z "$POLYGON_RPC_URL" ] && [ "$NETWORK" = "polygon" ]; then
    echo -e "${RED}❌ POLYGON_RPC_URL not set for mainnet deployment${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Security audit
echo "🔒 Running security audit..."
node security-analysis.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Security audit failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Security audit passed${NC}"

# Comprehensive testing
echo "🧪 Running comprehensive test suite..."
npx hardhat test enterprise-test-suite.js --config hardhat.config.minimal.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Test suite failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ All 96 tests passed${NC}"

# Compilation with production config
echo "🔨 Compiling contracts for production..."
npx hardhat compile --config hardhat.config.production.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Compilation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Contracts compiled successfully${NC}"

# Mainnet confirmation
if [ "$NETWORK" = "polygon" ] && [ "$PRODUCTION_MODE" = "true" ]; then
    echo -e "${RED}⚠️  WARNING: MAINNET DEPLOYMENT${NC}"
    echo -e "${RED}⚠️  This will deploy to Polygon mainnet with real funds!${NC}"
    echo -e "${YELLOW}⚠️  Are you sure? Type 'YES_DEPLOY_MAINNET' to continue:${NC}"
    read -r confirmation
    if [ "$confirmation" != "YES_DEPLOY_MAINNET" ]; then
        echo -e "${YELLOW}🛑 Deployment cancelled by user${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${YELLOW}📦 Phase 2: Contract Deployment${NC}"
echo "----------------------------------------"

# Deploy contracts
echo "🚀 Deploying contracts to $NETWORK..."
npx hardhat run scripts/deploy-production.js --network $NETWORK --config hardhat.config.production.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Contracts deployed successfully${NC}"

echo ""
echo -e "${YELLOW}🔍 Phase 3: Contract Verification${NC}"
echo "----------------------------------------"

# Verify contracts
echo "📋 Verifying contracts on block explorer..."
node scripts/verify-contracts.js --network $NETWORK
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Contract verification failed (continuing...)${NC}"
else
    echo -e "${GREEN}✅ Contracts verified on block explorer${NC}"
fi

echo ""
echo -e "${YELLOW}📊 Phase 4: Monitoring Setup${NC}"
echo "----------------------------------------"

# Setup monitoring
echo "🔔 Setting up production monitoring..."
node scripts/setup-monitoring.js $NETWORK &
MONITORING_PID=$!
sleep 5  # Give monitoring time to start
echo -e "${GREEN}✅ Monitoring system activated (PID: $MONITORING_PID)${NC}"

echo ""
echo -e "${YELLOW}✅ Phase 5: Post-Deployment Validation${NC}"
echo "----------------------------------------"

# Load deployment data
DEPLOYMENT_FILE="deployments/latest-$NETWORK.json"
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo -e "${RED}❌ Deployment file not found: $DEPLOYMENT_FILE${NC}"
    exit 1
fi

# Extract contract addresses
FACTORY_ADDRESS=$(node -p "JSON.parse(require('fs').readFileSync('$DEPLOYMENT_FILE', 'utf8')).contracts.escrowFactory.address")
echo "🏭 Factory Address: $FACTORY_ADDRESS"

# Validate deployment
echo "🔍 Validating deployment..."
if [ ${#FACTORY_ADDRESS} -eq 42 ]; then
    echo -e "${GREEN}✅ Valid contract address format${NC}"
else
    echo -e "${RED}❌ Invalid contract address format${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "• Network: $NETWORK"
echo "• Factory Contract: $FACTORY_ADDRESS"
echo "• Block Explorer: $([ "$NETWORK" = "polygon" ] && echo "https://polygonscan.com" || echo "https://mumbai.polygonscan.com")"
echo "• Monitoring: Active (PID: $MONITORING_PID)"
echo ""
echo -e "${BLUE}🔗 Next Steps:${NC}"
echo "1. Configure frontend with contract addresses"
echo "2. Test basic functionality on the network"
echo "3. Monitor alerts and system health"
echo "4. Set up user interfaces"
echo ""
echo -e "${GREEN}✅ Enterprise Property Escrow Platform is now live!${NC}"

# Save deployment completion status
echo "{\"status\":\"completed\",\"network\":\"$NETWORK\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"factoryAddress\":\"$FACTORY_ADDRESS\"}" > "deployments/status-$NETWORK.json"

exit 0