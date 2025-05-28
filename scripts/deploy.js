const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment to", network.name);
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));

  // Deployment configuration
  const config = {
    platformWallet: process.env.PLATFORM_WALLET || deployer.address,
    platformFee: process.env.PLATFORM_FEE || 100, // 1%
    defaultAgent: process.env.DEFAULT_AGENT || deployer.address,
    defaultArbiter: process.env.DEFAULT_ARBITER || deployer.address,
  };

  console.log("Deployment configuration:", config);

  // Deploy mock USDC for testing (only on testnet)
  let usdcAddress;
  if (network.name === "mumbai" || network.name === "localhost" || network.name === "hardhat") {
    console.log("📄 Deploying Mock USDC...");
    const MockUSDC = await ethers.getContractFactory("MockERC20");
    const mockUSDC = await MockUSDC.deploy(
      "USD Coin",
      "USDC",
      ethers.utils.parseUnits("1000000", 6) // 1M USDC with 6 decimals
    );
    await mockUSDC.deployed();
    usdcAddress = mockUSDC.address;
    console.log("✅ Mock USDC deployed to:", usdcAddress);
  } else {
    // Use real USDC address on mainnet
    usdcAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC on Polygon
    console.log("📄 Using existing USDC at:", usdcAddress);
  }

  // Deploy PropertyEscrow
  console.log("📄 Deploying PropertyEscrow...");
  const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
  const propertyEscrow = await PropertyEscrow.deploy(
    config.platformWallet,
    config.platformFee
  );
  await propertyEscrow.deployed();
  console.log("✅ PropertyEscrow deployed to:", propertyEscrow.address);

  // Deploy EscrowFactory
  console.log("📄 Deploying EscrowFactory...");
  const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
  const escrowFactory = await EscrowFactory.deploy(
    config.platformWallet,
    config.platformFee,
    config.defaultAgent,
    config.defaultArbiter
  );
  await escrowFactory.deployed();
  console.log("✅ EscrowFactory deployed to:", escrowFactory.address);

  // Setup initial configuration
  console.log("⚙️ Setting up initial configuration...");

  // Whitelist USDC in PropertyEscrow
  await propertyEscrow.whitelistToken(usdcAddress, true);
  console.log("✅ USDC whitelisted in PropertyEscrow");

  // Whitelist USDC in EscrowFactory
  await escrowFactory.whitelistToken(usdcAddress, true);
  console.log("✅ USDC whitelisted in EscrowFactory");

  // Grant roles in PropertyEscrow
  const AGENT_ROLE = await propertyEscrow.AGENT_ROLE();
  const ARBITER_ROLE = await propertyEscrow.ARBITER_ROLE();
  
  if (config.defaultAgent !== deployer.address) {
    await propertyEscrow.grantRole(AGENT_ROLE, config.defaultAgent);
    console.log("✅ Agent role granted to:", config.defaultAgent);
  }
  
  if (config.defaultArbiter !== deployer.address) {
    await propertyEscrow.grantRole(ARBITER_ROLE, config.defaultArbiter);
    console.log("✅ Arbiter role granted to:", config.defaultArbiter);
  }

  // Prepare deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      PropertyEscrow: {
        address: propertyEscrow.address,
        constructorArgs: [config.platformWallet, config.platformFee]
      },
      EscrowFactory: {
        address: escrowFactory.address,
        constructorArgs: [
          config.platformWallet,
          config.platformFee,
          config.defaultAgent,
          config.defaultArbiter
        ]
      }
    },
    tokens: {
      USDC: {
        address: usdcAddress,
        whitelisted: true
      }
    },
    configuration: config,
    gasUsed: {
      PropertyEscrow: (await propertyEscrow.deployTransaction.wait()).gasUsed.toString(),
      EscrowFactory: (await escrowFactory.deployTransaction.wait()).gasUsed.toString()
    }
  };

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("📝 Deployment info saved to:", deploymentFile);

  // Wait for confirmations on live networks
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("⏳ Waiting for block confirmations...");
    await propertyEscrow.deployTransaction.wait(5);
    await escrowFactory.deployTransaction.wait(5);
    console.log("✅ Confirmations received");
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("PropertyEscrow:", propertyEscrow.address);
  console.log("EscrowFactory:", escrowFactory.address);
  console.log("USDC Token:", usdcAddress);

  console.log("\n🔧 Next steps:");
  console.log("1. Verify contracts on blockchain explorer");
  console.log("2. Test basic functionality");
  console.log("3. Set up monitoring and alerts");
  console.log("4. Update frontend configuration");

  // Return addresses for use in other scripts
  return {
    propertyEscrow: propertyEscrow.address,
    escrowFactory: escrowFactory.address,
    usdc: usdcAddress
  };
}

async function deployTestEnvironment() {
  console.log("🧪 Setting up test environment...");
  
  const addresses = await main();
  const [deployer, testBuyer, testSeller] = await ethers.getSigners();

  // Mint test USDC to test accounts on testnet
  if (network.name === "mumbai" || network.name === "localhost" || network.name === "hardhat") {
    const MockUSDC = await ethers.getContractFactory("MockERC20");
    const usdc = MockUSDC.attach(addresses.usdc);
    
    const testAmount = ethers.utils.parseUnits("10000", 6); // 10k USDC
    
    if (testBuyer) {
      await usdc.transfer(testBuyer.address, testAmount);
      console.log("✅ Minted test USDC to buyer:", testBuyer.address);
    }
    
    if (testSeller) {
      await usdc.transfer(testSeller.address, testAmount);
      console.log("✅ Minted test USDC to seller:", testSeller.address);
    }
  }

  console.log("✅ Test environment setup complete");
}

// Allow script to be called directly or imported
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = { main, deployTestEnvironment };
