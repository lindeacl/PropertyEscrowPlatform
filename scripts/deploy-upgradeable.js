/**
 * Deployment script for upgradeable contracts with compliance integration
 */

const { ethers, upgrades } = require("hardhat");

class UpgradeableDeployer {
  constructor(network) {
    this.network = network;
    this.isMainnet = network === "polygon";
    this.deploymentData = {
      network: network,
      timestamp: new Date().toISOString(),
      contracts: {},
      proxies: {},
      compliance: {}
    };
  }

  async deploy() {
    console.log(`🔄 Deploying upgradeable contracts to ${this.network}`);
    
    try {
      // Deploy compliance manager first
      await this.deployComplianceManager();
      
      // Deploy upgradeable factory
      await this.deployUpgradeableFactory();
      
      // Configure compliance integration
      await this.configureCompliance();
      
      // Save deployment data
      await this.saveDeploymentData();
      
      console.log("✅ Upgradeable deployment completed!");
      this.printDeploymentSummary();
      
    } catch (error) {
      console.error("❌ Upgradeable deployment failed:", error);
      throw error;
    }
  }

  async deployComplianceManager() {
    console.log("📋 Deploying Compliance Manager...");
    
    const [deployer] = await ethers.getSigners();
    const ComplianceManager = await ethers.getContractFactory("ComplianceManager");
    
    const complianceManager = await ComplianceManager.deploy(deployer.address);
    await complianceManager.waitForDeployment();
    
    const complianceAddress = await complianceManager.getAddress();
    
    this.deploymentData.contracts.complianceManager = {
      address: complianceAddress,
      admin: deployer.address
    };
    
    console.log(`✅ Compliance Manager deployed: ${complianceAddress}`);
  }

  async deployUpgradeableFactory() {
    console.log("🏭 Deploying Upgradeable Factory...");
    
    const [deployer] = await ethers.getSigners();
    const EscrowFactoryUpgradeable = await ethers.getContractFactory("EscrowFactoryUpgradeable");
    
    const platformWallet = process.env.PLATFORM_WALLET || deployer.address;
    const platformFee = 250; // 2.5%
    const defaultAgent = process.env.DEFAULT_AGENT || deployer.address;
    const defaultArbiter = process.env.DEFAULT_ARBITER || deployer.address;
    const complianceManager = this.deploymentData.contracts.complianceManager.address;

    // Deploy with proxy
    const proxy = await upgrades.deployProxy(
      EscrowFactoryUpgradeable,
      [
        platformWallet,
        platformFee,
        defaultAgent,
        defaultArbiter,
        complianceManager
      ],
      {
        initializer: 'initialize',
        kind: 'uups'
      }
    );

    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    
    this.deploymentData.proxies.escrowFactory = {
      proxy: proxyAddress,
      implementation: await upgrades.erc1967.getImplementationAddress(proxyAddress),
      admin: await upgrades.erc1967.getAdminAddress(proxyAddress)
    };
    
    this.deploymentData.contracts.escrowFactoryUpgradeable = {
      address: proxyAddress,
      platformWallet: platformWallet,
      platformFee: platformFee,
      defaultAgent: defaultAgent,
      defaultArbiter: defaultArbiter,
      complianceManager: complianceManager
    };

    console.log(`✅ Upgradeable Factory deployed: ${proxyAddress}`);
    console.log(`   Implementation: ${this.deploymentData.proxies.escrowFactory.implementation}`);
  }

  async configureCompliance() {
    console.log("⚙️ Configuring compliance integration...");
    
    const complianceAddress = this.deploymentData.contracts.complianceManager.address;
    const complianceManager = await ethers.getContractAt("ComplianceManager", complianceAddress);
    
    // Grant compliance officer role to deployer for initial setup
    const [deployer] = await ethers.getSigners();
    const COMPLIANCE_OFFICER_ROLE = await complianceManager.COMPLIANCE_OFFICER_ROLE();
    
    console.log("   Setting up compliance roles...");
    // Role should already be granted in constructor
    
    // Configure jurisdiction approvals (example setup)
    console.log("   Configuring jurisdiction settings...");
    // Jurisdictions are already configured in constructor
    
    this.deploymentData.compliance = {
      manager: complianceAddress,
      configured: true,
      defaultJurisdictions: ["US", "UK", "EU", "CA", "AU"]
    };

    console.log("✅ Compliance integration configured");
  }

  async saveDeploymentData() {
    const fs = require("fs");
    const path = require("path");
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `upgradeable-deployment-${this.network}-${timestamp}.json`;
    const filepath = path.join(__dirname, '../deployments', filename);
    
    // Ensure deployments directory exists
    const deployDir = path.dirname(filepath);
    if (!fs.existsSync(deployDir)) {
      fs.mkdirSync(deployDir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(this.deploymentData, null, 2));
    console.log(`💾 Upgradeable deployment data saved: ${filepath}`);

    // Also save as latest upgradeable
    const latestPath = path.join(deployDir, `latest-upgradeable-${this.network}.json`);
    fs.writeFileSync(latestPath, JSON.stringify(this.deploymentData, null, 2));
  }

  printDeploymentSummary() {
    console.log("\n🔄 UPGRADEABLE DEPLOYMENT SUMMARY");
    console.log("==========================================");
    console.log(`Network: ${this.network.toUpperCase()}`);
    console.log(`Chain ID: ${this.isMainnet ? 137 : 80001}`);
    console.log("");
    
    if (this.deploymentData.contracts.complianceManager) {
      console.log(`📋 Compliance Manager: ${this.deploymentData.contracts.complianceManager.address}`);
    }
    
    if (this.deploymentData.proxies.escrowFactory) {
      console.log(`🏭 Factory Proxy: ${this.deploymentData.proxies.escrowFactory.proxy}`);
      console.log(`   Implementation: ${this.deploymentData.proxies.escrowFactory.implementation}`);
      console.log(`   Admin: ${this.deploymentData.proxies.escrowFactory.admin}`);
    }
    
    console.log("");
    console.log("🔄 Upgrade Features:");
    console.log("• UUPS proxy pattern enabled");
    console.log("• Compliance management integrated");
    console.log("• KYC/AML validation hooks");
    console.log("• Future upgrade capability");
    console.log("==========================================\n");
  }
}

async function main() {
  const network = process.env.HARDHAT_NETWORK || "mumbai";
  
  if (!["polygon", "mumbai"].includes(network)) {
    throw new Error(`Unsupported network: ${network}. Use 'polygon' or 'mumbai'`);
  }

  const deployer = new UpgradeableDeployer(network);
  await deployer.deploy();
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { UpgradeableDeployer };