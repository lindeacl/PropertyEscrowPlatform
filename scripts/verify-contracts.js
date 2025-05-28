/**
 * Contract Verification Script for Polygon Networks
 * Automatically verifies deployed contracts on Polygonscan
 */

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = util.promisify(exec);

class ContractVerifier {
  constructor(network, deploymentData) {
    this.network = network;
    this.deploymentData = deploymentData;
    this.isMainnet = network === "polygon";
    this.explorerUrl = this.isMainnet 
      ? "https://polygonscan.com" 
      : "https://mumbai.polygonscan.com";
  }

  async verifyAll() {
    console.log(`🔍 Starting contract verification on ${this.network}`);
    console.log(`Explorer: ${this.explorerUrl}`);

    try {
      // Verify EscrowFactory
      await this.verifyEscrowFactory();
      
      // Verify MockToken (testnet only)
      if (!this.isMainnet && this.deploymentData.contracts.mockToken) {
        await this.verifyMockToken();
      }

      console.log("✅ All contracts verified successfully!");
      this.printVerificationSummary();

    } catch (error) {
      console.error("❌ Verification failed:", error);
      throw error;
    }
  }

  async verifyEscrowFactory() {
    console.log("🏭 Verifying EscrowFactory contract...");
    
    const contract = this.deploymentData.contracts.escrowFactory;
    const constructorArgs = [
      contract.platformWallet,
      contract.platformFee.toString(),
      contract.defaultAgent,
      contract.defaultArbiter
    ];

    const command = `npx hardhat verify --network ${this.network} ${contract.address} "${constructorArgs[0]}" ${constructorArgs[1]} "${constructorArgs[2]}" "${constructorArgs[3]}"`;
    
    try {
      const { stdout, stderr } = await execAsync(command);
      console.log("✅ EscrowFactory verified");
      console.log(`   Address: ${contract.address}`);
      console.log(`   Explorer: ${this.explorerUrl}/address/${contract.address}`);
      
      this.deploymentData.verification.escrowFactory = {
        status: "verified",
        address: contract.address,
        explorerUrl: `${this.explorerUrl}/address/${contract.address}`,
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("ℹ️  EscrowFactory already verified");
        this.deploymentData.verification.escrowFactory = {
          status: "already_verified",
          address: contract.address,
          explorerUrl: `${this.explorerUrl}/address/${contract.address}`
        };
      } else {
        throw new Error(`EscrowFactory verification failed: ${error.message}`);
      }
    }
  }

  async verifyMockToken() {
    console.log("🪙 Verifying MockToken contract...");
    
    const contract = this.deploymentData.contracts.mockToken;
    const constructorArgs = [
      "Property Escrow Test Token",
      "PETT", 
      contract.supply
    ];

    const command = `npx hardhat verify --network ${this.network} ${contract.address} "${constructorArgs[0]}" "${constructorArgs[1]}" "${constructorArgs[2]}"`;
    
    try {
      const { stdout, stderr } = await execAsync(command);
      console.log("✅ MockToken verified");
      console.log(`   Address: ${contract.address}`);
      console.log(`   Explorer: ${this.explorerUrl}/address/${contract.address}`);
      
      this.deploymentData.verification.mockToken = {
        status: "verified",
        address: contract.address,
        explorerUrl: `${this.explorerUrl}/address/${contract.address}`,
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("ℹ️  MockToken already verified");
        this.deploymentData.verification.mockToken = {
          status: "already_verified",
          address: contract.address,
          explorerUrl: `${this.explorerUrl}/address/${contract.address}`
        };
      } else {
        throw new Error(`MockToken verification failed: ${error.message}`);
      }
    }
  }

  printVerificationSummary() {
    console.log("\n🔍 VERIFICATION SUMMARY");
    console.log("==========================================");
    console.log(`Network: ${this.network.toUpperCase()}`);
    console.log(`Explorer: ${this.explorerUrl}`);
    console.log("");

    if (this.deploymentData.verification.escrowFactory) {
      const factory = this.deploymentData.verification.escrowFactory;
      console.log(`🏭 EscrowFactory: ${factory.status}`);
      console.log(`   ${factory.explorerUrl}`);
    }

    if (this.deploymentData.verification.mockToken) {
      const token = this.deploymentData.verification.mockToken;
      console.log(`🪙 MockToken: ${token.status}`);
      console.log(`   ${token.explorerUrl}`);
    }

    console.log("==========================================\n");
  }
}

async function main() {
  const args = process.argv.slice(2);
  let network, deploymentFile;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--network' && i + 1 < args.length) {
      network = args[i + 1];
    } else if (args[i] === '--deployment' && i + 1 < args.length) {
      deploymentFile = args[i + 1];
    }
  }

  if (!network) {
    network = process.env.HARDHAT_NETWORK || "mumbai";
  }

  // Load deployment data
  let deploymentData;
  if (deploymentFile) {
    deploymentData = JSON.parse(deploymentFile);
  } else {
    // Load latest deployment
    const latestFile = path.join(__dirname, `../deployments/latest-${network}.json`);
    if (!fs.existsSync(latestFile)) {
      throw new Error(`No deployment found for ${network}. Deploy contracts first.`);
    }
    deploymentData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
  }

  const verifier = new ContractVerifier(network, deploymentData);
  await verifier.verifyAll();

  // Update deployment file with verification results
  if (!deploymentFile) {
    const latestFile = path.join(__dirname, `../deployments/latest-${network}.json`);
    fs.writeFileSync(latestFile, JSON.stringify(deploymentData, null, 2));
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { ContractVerifier };