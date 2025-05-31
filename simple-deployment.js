const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Enterprise Property Escrow Platform...\n");

  const [deployer, buyer, seller, agent, arbiter] = await ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  try {
    // Deploy MockERC20 token
    console.log("📄 Deploying Mock USDC...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      "Demo USDC",
      "USDC", 
      ethers.parseUnits("1000000", 18)
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ MockERC20 deployed to:", tokenAddress);

    // Deploy EscrowFactory
    console.log("🏭 Deploying EscrowFactory...");
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    const factory = await EscrowFactory.deploy(
      deployer.address, // platformWallet
      250, // platformFee (2.5%)
      agent.address, // defaultAgent
      arbiter.address // defaultArbiter
    );
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("✅ EscrowFactory deployed to:", factoryAddress);

    // Whitelist the token
    console.log("🔐 Whitelisting token...");
    await factory.whitelistToken(tokenAddress, true);
    console.log("✅ Token whitelisted successfully");

    // Distribute tokens
    console.log("💰 Distributing tokens...");
    const amount = ethers.parseUnits("10000", 18);
    await token.transfer(buyer.address, amount);
    await token.transfer(seller.address, amount);
    console.log("✅ Tokens distributed");

    console.log("\n🎉 Deployment Complete!");
    console.log("=" .repeat(50));
    console.log(`Token Address: ${tokenAddress}`);
    console.log(`Factory Address: ${factoryAddress}`);
    console.log("=" .repeat(50));

    // Save deployment info
    const deploymentInfo = {
      token: tokenAddress,
      factory: factoryAddress,
      accounts: {
        deployer: deployer.address,
        buyer: buyer.address,
        seller: seller.address,
        agent: agent.address,
        arbiter: arbiter.address
      }
    };

    const fs = require('fs');
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to deployment-info.json");

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });