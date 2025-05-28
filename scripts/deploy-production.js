/**
 * Production Deployment Script for Enterprise Property Escrow Platform
 * Supports Polygon Mainnet and Mumbai Testnet with comprehensive validation
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

class ProductionDeployer {
  constructor(network) {
    this.network = network;
    this.deploymentData = {
      network: network,
      timestamp: new Date().toISOString(),
      contracts: {},
      verification: {},
      gasUsed: {},
      addresses: {}
    };
    this.isMainnet = network === "polygon";
  }

  async deploy() {
    console.log(`🚀 Starting production deployment on ${this.network}`);
    console.log(`⚠️  MAINNET DEPLOYMENT: ${this.isMainnet ? "YES" : "NO"}`);
    
    if (this.isMainnet) {
      await this.confirmMainnetDeployment();
    }

    try {
      // Pre-deployment validation
      await this.validateEnvironment();
      
      // Deploy contracts
      await this.deployMockToken();
      await this.deployEscrowFactory();
      
      // Post-deployment setup
      await this.configureContracts();
      await this.validateDeployment();
      
      // Save deployment data
      await this.saveDeploymentData();
      
      // Contract verification
      await this.scheduleVerification();
      
      console.log("🎉 Production deployment completed successfully!");
      this.printDeploymentSummary();
      
    } catch (error) {
      console.error("❌ Deployment failed:", error);
      await this.saveFailureLog(error);
      throw error;
    }
  }

  async confirmMainnetDeployment() {
    console.log("⚠️  WARNING: This is a MAINNET deployment!");
    console.log("⚠️  Real funds will be at risk!");
    console.log("⚠️  Ensure all testing is complete!");
    
    // In production, you'd implement proper confirmation
    const confirmation = process.env.MAINNET_DEPLOYMENT_CONFIRMED;
    if (confirmation !== "YES_I_UNDERSTAND_RISKS") {
      throw new Error("Mainnet deployment not confirmed. Set MAINNET_DEPLOYMENT_CONFIRMED=YES_I_UNDERSTAND_RISKS");
    }
  }

  async validateEnvironment() {
    console.log("🔍 Validating deployment environment...");
    
    // Check required environment variables
    const requiredVars = [
      'PRIVATE_KEY',
      'POLYGON_RPC_URL',
      'PLATFORM_WALLET',
      'DEFAULT_AGENT',
      'DEFAULT_ARBITER'
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    }

    // Validate addresses
    const addresses = {
      platformWallet: process.env.PLATFORM_WALLET,
      defaultAgent: process.env.DEFAULT_AGENT,
      defaultArbiter: process.env.DEFAULT_ARBITER
    };

    for (const [name, address] of Object.entries(addresses)) {
      if (!ethers.isAddress(address)) {
        throw new Error(`Invalid ${name} address: ${address}`);
      }
    }

    // Check deployer balance
    const [deployer] = await ethers.getSigners();
    const balance = await deployer.provider.getBalance(deployer.address);
    const minBalance = ethers.parseEther(this.isMainnet ? "0.1" : "0.01");
    
    if (balance < minBalance) {
      throw new Error(`Insufficient deployer balance. Required: ${ethers.formatEther(minBalance)} MATIC`);
    }

    console.log(`✅ Environment validation passed`);
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} MATIC`);
  }

  async deployMockToken() {
    if (this.isMainnet) {
      console.log("⏭️  Skipping mock token deployment on mainnet");
      return;
    }

    console.log("📄 Deploying Mock ERC20 Token...");
    
    const MockToken = await ethers.getContractFactory("MockERC20");
    const initialSupply = ethers.parseEther("1000000"); // 1M tokens
    
    const token = await MockToken.deploy(
      "Property Escrow Test Token",
      "PETT",
      initialSupply
    );

    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    
    this.deploymentData.contracts.mockToken = {
      address: tokenAddress,
      name: "Property Escrow Test Token",
      symbol: "PETT",
      supply: initialSupply.toString()
    };

    console.log(`✅ Mock Token deployed: ${tokenAddress}`);
  }

  async deployEscrowFactory() {
    console.log("🏭 Deploying Escrow Factory...");
    
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    
    const platformWallet = process.env.PLATFORM_WALLET;
    const platformFee = 250; // 2.5%
    const defaultAgent = process.env.DEFAULT_AGENT;
    const defaultArbiter = process.env.DEFAULT_ARBITER;

    console.log("   Platform Wallet:", platformWallet);
    console.log("   Platform Fee:", platformFee, "basis points");
    console.log("   Default Agent:", defaultAgent);
    console.log("   Default Arbiter:", defaultArbiter);

    const factory = await EscrowFactory.deploy(
      platformWallet,
      platformFee,
      defaultAgent,
      defaultArbiter
    );

    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    
    this.deploymentData.contracts.escrowFactory = {
      address: factoryAddress,
      platformWallet: platformWallet,
      platformFee: platformFee,
      defaultAgent: defaultAgent,
      defaultArbiter: defaultArbiter
    };

    console.log(`✅ Escrow Factory deployed: ${factoryAddress}`);
  }

  async configureContracts() {
    console.log("⚙️  Configuring contracts...");
    
    const factoryAddress = this.deploymentData.contracts.escrowFactory.address;
    const factory = await ethers.getContractAt("EscrowFactory", factoryAddress);

    // Whitelist tokens for testnet
    if (!this.isMainnet && this.deploymentData.contracts.mockToken) {
      const tokenAddress = this.deploymentData.contracts.mockToken.address;
      
      console.log("   Whitelisting mock token...");
      const whitelistTx = await factory.whitelistToken(tokenAddress, true);
      await whitelistTx.wait();
      
      this.deploymentData.configuration = {
        whitelistedTokens: [tokenAddress]
      };
    }

    console.log("✅ Contract configuration completed");
  }

  async validateDeployment() {
    console.log("🔍 Validating deployment...");
    
    const factoryAddress = this.deploymentData.contracts.escrowFactory.address;
    const factory = await ethers.getContractAt("EscrowFactory", factoryAddress);

    // Test basic functionality
    const platformWallet = await factory.platformWallet();
    const defaultAgent = await factory.getDefaultAgent();
    const defaultArbiter = await factory.getDefaultArbiter();

    console.log("   Platform Wallet:", platformWallet);
    console.log("   Default Agent:", defaultAgent);
    console.log("   Default Arbiter:", defaultArbiter);

    // Validate configuration
    if (platformWallet !== process.env.PLATFORM_WALLET) {
      throw new Error("Platform wallet mismatch");
    }

    if (defaultAgent !== process.env.DEFAULT_AGENT) {
      throw new Error("Default agent mismatch");
    }

    if (defaultArbiter !== process.env.DEFAULT_ARBITER) {
      throw new Error("Default arbiter mismatch");
    }

    console.log("✅ Deployment validation passed");
  }

  async saveDeploymentData() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `deployment-${this.network}-${timestamp}.json`;
    const filepath = path.join(__dirname, '../deployments', filename);
    
    // Ensure deployments directory exists
    const deployDir = path.dirname(filepath);
    if (!fs.existsSync(deployDir)) {
      fs.mkdirSync(deployDir, { recursive: true });
    }

    // Add network info
    this.deploymentData.network = this.network;
    this.deploymentData.chainId = this.isMainnet ? 137 : 80001;
    this.deploymentData.explorer = this.isMainnet 
      ? "https://polygonscan.com" 
      : "https://mumbai.polygonscan.com";

    fs.writeFileSync(filepath, JSON.stringify(this.deploymentData, null, 2));
    console.log(`💾 Deployment data saved: ${filepath}`);

    // Also save as latest
    const latestPath = path.join(deployDir, `latest-${this.network}.json`);
    fs.writeFileSync(latestPath, JSON.stringify(this.deploymentData, null, 2));
  }

  async scheduleVerification() {
    console.log("📋 Scheduling contract verification...");
    
    const verificationScript = path.join(__dirname, 'verify-contracts.js');
    const command = `node ${verificationScript} --network ${this.network} --deployment ${JSON.stringify(this.deploymentData)}`;
    
    console.log("   Verification command:", command);
    console.log("   Note: Run verification script separately after deployment");
    
    // Save verification commands
    const verifyCommands = {
      escrowFactory: `npx hardhat verify --network ${this.network} ${this.deploymentData.contracts.escrowFactory.address} "${process.env.PLATFORM_WALLET}" 250 "${process.env.DEFAULT_AGENT}" "${process.env.DEFAULT_ARBITER}"`
    };

    if (this.deploymentData.contracts.mockToken) {
      verifyCommands.mockToken = `npx hardhat verify --network ${this.network} ${this.deploymentData.contracts.mockToken.address} "Property Escrow Test Token" "PETT" "1000000000000000000000000"`;
    }

    this.deploymentData.verification.commands = verifyCommands;
  }

  async saveFailureLog(error) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `deployment-failure-${this.network}-${timestamp}.json`;
    const filepath = path.join(__dirname, '../deployments/failures', filename);
    
    const failureDir = path.dirname(filepath);
    if (!fs.existsSync(failureDir)) {
      fs.mkdirSync(failureDir, { recursive: true });
    }

    const failureData = {
      ...this.deploymentData,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    };

    fs.writeFileSync(filepath, JSON.stringify(failureData, null, 2));
    console.log(`💾 Failure log saved: ${filepath}`);
  }

  printDeploymentSummary() {
    console.log("\n🎉 DEPLOYMENT SUMMARY");
    console.log("==========================================");
    console.log(`Network: ${this.network.toUpperCase()}`);
    console.log(`Chain ID: ${this.isMainnet ? 137 : 80001}`);
    console.log(`Explorer: ${this.isMainnet ? "https://polygonscan.com" : "https://mumbai.polygonscan.com"}`);
    console.log("");
    
    if (this.deploymentData.contracts.escrowFactory) {
      console.log(`🏭 Escrow Factory: ${this.deploymentData.contracts.escrowFactory.address}`);
    }
    
    if (this.deploymentData.contracts.mockToken) {
      console.log(`🪙 Mock Token: ${this.deploymentData.contracts.mockToken.address}`);
    }
    
    console.log("");
    console.log("⚡ Next Steps:");
    console.log("1. Verify contracts on block explorer");
    console.log("2. Set up monitoring and alerting");
    console.log("3. Configure frontend with contract addresses");
    console.log("4. Test basic functionality");
    console.log("==========================================\n");
  }
}

// Main deployment function
async function main() {
  const network = process.env.HARDHAT_NETWORK || hre.network.name;
  
  if (!["polygon", "mumbai"].includes(network)) {
    throw new Error(`Unsupported network: ${network}. Use 'polygon' or 'mumbai'`);
  }

  const deployer = new ProductionDeployer(network);
  await deployer.deploy();
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { ProductionDeployer };