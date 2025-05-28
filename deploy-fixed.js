const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  console.log("🚀 Completing Property Escrow Platform Deployment...");

  // Connect to local network
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  const deployer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
  const agent = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);
  const arbiter = new ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", provider);
  const platformWallet = new ethers.Wallet("0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", provider);
  
  console.log("📝 Deploying with account:", deployer.address);

  // Mock token is already deployed
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  console.log("📄 Using existing Mock Token at:", tokenAddress);

  // Load contract artifacts
  const factoryArt = JSON.parse(fs.readFileSync("./artifacts/contracts/EscrowFactory.sol/EscrowFactory.json"));

  // Deploy EscrowFactory with fresh nonce
  console.log("\n🏭 Deploying EscrowFactory...");
  const nonce = await provider.getTransactionCount(deployer.address);
  const EscrowFactoryContract = new ethers.ContractFactory(factoryArt.abi, factoryArt.bytecode, deployer);
  const factory = await EscrowFactoryContract.deploy(
    platformWallet.address,  // Platform wallet
    250,                     // 2.5% platform fee
    agent.address,           // Default agent
    arbiter.address,         // Default arbiter
    { nonce }
  );
  await factory.waitForDeployment();
  console.log("✅ EscrowFactory deployed to:", await factory.getAddress());

  // Whitelist the token
  console.log("\n🔐 Whitelisting token...");
  await factory.whitelistToken(tokenAddress);
  console.log("✅ Token whitelisted successfully");

  // Create deployment info file
  const deploymentInfo = {
    network: "localhost",
    chainId: 31337,
    contracts: {
      mockToken: tokenAddress,
      escrowFactory: await factory.getAddress()
    },
    accounts: {
      deployer: deployer.address,
      agent: agent.address,
      arbiter: arbiter.address,
      platformWallet: platformWallet.address
    }
  };

  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("========================================");
  console.log("🏭 EscrowFactory:", await factory.getAddress());
  console.log("📄 Token:", tokenAddress);
  console.log("📋 Deployment info saved to deployment.json");
  console.log("========================================");
  console.log("\n✨ Your enterprise property escrow platform is now live!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });