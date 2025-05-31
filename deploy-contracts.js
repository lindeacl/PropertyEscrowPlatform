const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Enterprise Property Escrow Platform contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy MockERC20 for testing
  console.log("\n📄 Deploying MockERC20...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy("USD Coin", "USDC", 6);
  await mockToken.waitForDeployment();
  console.log("MockERC20 deployed to:", await mockToken.getAddress());

  // Mint tokens for testing
  const mintAmount = ethers.parseUnits("1000000", 6); // 1M USDC
  await mockToken.mint(deployer.address, mintAmount);
  console.log("Minted", ethers.formatUnits(mintAmount, 6), "USDC to deployer");

  // Deploy PropertyEscrow
  console.log("\n🏠 Deploying PropertyEscrow...");
  const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
  const propertyEscrow = await PropertyEscrow.deploy(
    deployer.address, // Platform wallet
    250 // 2.5% platform fee
  );
  await propertyEscrow.waitForDeployment();
  console.log("PropertyEscrow deployed to:", await propertyEscrow.getAddress());

  // Whitelist the mock token
  await propertyEscrow.whitelistToken(await mockToken.getAddress(), true);
  console.log("Whitelisted USDC token in PropertyEscrow");

  // Deploy EscrowFactory
  console.log("\n🏭 Deploying EscrowFactory...");
  const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
  const escrowFactory = await EscrowFactory.deploy(
    deployer.address, // Platform wallet
    250, // 2.5% platform fee
    deployer.address, // Default agent
    deployer.address  // Default arbiter
  );
  await escrowFactory.waitForDeployment();
  console.log("EscrowFactory deployed to:", await escrowFactory.getAddress());

  // Whitelist the mock token in factory
  await escrowFactory.whitelistToken(await mockToken.getAddress(), true);
  console.log("Whitelisted USDC token in EscrowFactory");

  // Create deployment summary
  const deploymentInfo = {
    network: "localhost",
    contracts: {
      MockERC20: await mockToken.getAddress(),
      PropertyEscrow: await propertyEscrow.getAddress(),
      EscrowFactory: await escrowFactory.getAddress()
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  // Save deployment info
  const fs = require('fs');
  fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✅ Deployment Summary:");
  console.log("==========================================");
  console.log("MockERC20 (USDC):", deploymentInfo.contracts.MockERC20);
  console.log("PropertyEscrow:", deploymentInfo.contracts.PropertyEscrow);
  console.log("EscrowFactory:", deploymentInfo.contracts.EscrowFactory);
  console.log("==========================================");
  console.log("Deployment info saved to deployment-info.json");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });