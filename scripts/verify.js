const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Verify deployed contracts on blockchain explorer
 */
async function verifyContracts() {
  console.log("🔍 Starting contract verification...");

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found:", deploymentFile);
    console.log("Please run deployment script first");
    return;
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  console.log("📋 Loaded deployment info for network:", deploymentInfo.network);

  // Verify PropertyEscrow
  await verifyContract(
    "PropertyEscrow",
    deploymentInfo.contracts.PropertyEscrow.address,
    deploymentInfo.contracts.PropertyEscrow.constructorArgs
  );

  // Verify EscrowFactory
  await verifyContract(
    "EscrowFactory",
    deploymentInfo.contracts.EscrowFactory.address,
    deploymentInfo.contracts.EscrowFactory.constructorArgs
  );

  // Verify MockERC20 if deployed on testnet
  if (deploymentInfo.network === "mumbai" || deploymentInfo.network === "localhost") {
    await verifyContract(
      "MockERC20",
      deploymentInfo.tokens.USDC.address,
      [
        "USD Coin",
        "USDC", 
        "1000000000000" // 1M USDC with 6 decimals
      ]
    );
  }

  console.log("✅ Contract verification completed!");
}

/**
 * Verify a single contract
 */
async function verifyContract(contractName, address, constructorArgs) {
  console.log(`\n🔍 Verifying ${contractName} at ${address}...`);
  
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ ${contractName} verified successfully`);
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`✅ ${contractName} already verified`);
    } else {
      console.error(`❌ ${contractName} verification failed:`, error.message);
    }
  }
}

/**
 * Verify specific contract by address
 */
async function verifyByAddress(contractAddress, constructorArgs = []) {
  console.log("🔍 Verifying contract at:", contractAddress);
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });
    console.log("✅ Contract verified successfully");
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("✅ Contract already verified");
    } else {
      console.error("❌ Verification failed:", error.message);
    }
  }
}

/**
 * Batch verify multiple contracts
 */
async function batchVerify(contracts) {
  console.log("🔍 Starting batch verification...");
  
  for (const contract of contracts) {
    await verifyContract(contract.name, contract.address, contract.args);
    
    // Wait between verifications to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("✅ Batch verification completed!");
}

/**
 * Get verification status of a contract
 */
async function getVerificationStatus(address) {
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    return false; // Not verified if verification attempt doesn't fail
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      return true; // Already verified
    }
    return false; // Verification failed for other reason
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Verify all contracts from deployment file
    verifyContracts()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
      });
  } else if (args[0] === "--address" && args[1]) {
    // Verify specific contract by address
    const constructorArgs = args.slice(2);
    verifyByAddress(args[1], constructorArgs)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
      });
  } else if (args[0] === "--help") {
    console.log(`
Usage:
  npx hardhat run scripts/verify.js --network <network>
  npx hardhat run scripts/verify.js --network <network> -- --address <contract_address> [constructor_args...]

Examples:
  npx hardhat run scripts/verify.js --network mumbai
  npx hardhat run scripts/verify.js --network polygon
  npx hardhat run scripts/verify.js --network mumbai -- --address 0x1234... arg1 arg2

Options:
  --address    Verify specific contract by address
  --help       Show this help message
    `);
  } else {
    console.error("❌ Invalid arguments. Use --help for usage information.");
    process.exit(1);
  }
}

module.exports = {
  verifyContracts,
  verifyContract,
  verifyByAddress,
  batchVerify,
  getVerificationStatus
};
