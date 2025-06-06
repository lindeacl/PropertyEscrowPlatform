const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy MockERC20 token
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy(
    "Demo USDC",
    "USDC",
    ethers.parseUnits("1000000", 18)
  );
  await token.waitForDeployment();
  console.log("MockERC20 deployed to:", await token.getAddress());

  // Deploy EscrowFactory
  const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
  const factory = await EscrowFactory.deploy(
    deployer.address, // platformWallet
    250, // platformFee (2.5% in basis points)
    deployer.address, // defaultAgent
    deployer.address  // defaultArbiter
  );
  await factory.waitForDeployment();
  console.log("EscrowFactory deployed to:", await factory.getAddress());

  // Whitelist the token
  await factory.whitelistToken(await token.getAddress(), true);
  console.log("Token whitelisted in factory");

  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });