const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying Property Escrow Platform...");

  // Connect to local network
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  const deployer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
  const agent = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);
  const arbiter = new ethers.Wallet("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", provider);
  const platformWallet = new ethers.Wallet("0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", provider);
  
  console.log("📝 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Load contract artifacts
  const mockTokenArt = JSON.parse(fs.readFileSync("./artifacts/contracts/mocks/MockERC20.sol/MockERC20.json"));
  const factoryArt = JSON.parse(fs.readFileSync("./artifacts/contracts/EscrowFactory.sol/EscrowFactory.json"));

  // Deploy MockERC20 token for testing
  console.log("\n📄 Deploying Mock Token...");
  const MockTokenFactory = new ethers.ContractFactory(mockTokenArt.abi, mockTokenArt.bytecode, deployer);
  const token = await MockTokenFactory.deploy("Property Token", "PROP", ethers.parseEther("1000000"));
  await token.waitForDeployment();
  console.log("✅ Mock Token deployed to:", await token.getAddress());

  // Deploy EscrowFactory
  console.log("\n🏭 Deploying EscrowFactory...");
  const EscrowFactoryContract = new ethers.ContractFactory(factoryArt.abi, factoryArt.bytecode, deployer);
  const factory = await EscrowFactoryContract.deploy(
    platformWallet.address,  // Platform wallet
    250,                     // 2.5% platform fee
    agent.address,           // Default agent
    arbiter.address          // Default arbiter
  );
  await factory.waitForDeployment();
  console.log("✅ EscrowFactory deployed to:", await factory.getAddress());

  // Whitelist the token
  console.log("\n🔐 Whitelisting token...");
  await factory.whitelistToken(token.address);
  console.log("✅ Token whitelisted successfully");

  // Create a test escrow
  console.log("\n🏠 Creating test property escrow...");
  const escrowTx = await factory.createEscrow(
    "123 Property Street",           // Property ID
    deployer.address,                // Buyer
    agent.address,                   // Seller (using agent address for demo)
    token.address,                   // Payment token
    hre.ethers.utils.parseEther("100"), // Purchase amount
    Math.floor(Date.now() / 1000) + 86400, // Deposit deadline (24h)
    Math.floor(Date.now() / 1000) + 172800, // Verification deadline (48h)
    250,  // Agent fee (2.5%)
    250   // Arbiter fee (2.5%)
  );
  
  const receipt = await escrowTx.wait();
  const escrowEvent = receipt.events?.find(e => e.event === 'EscrowContractDeployed');
  const escrowAddress = escrowEvent?.args?.escrowContract;
  
  console.log("✅ Test escrow created at:", escrowAddress);

  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("========================================");
  console.log("🏭 EscrowFactory:", factory.address);
  console.log("📄 Token:", token.address);
  console.log("🏠 Test Escrow:", escrowAddress);
  console.log("========================================");
  console.log("\n✨ Your enterprise property escrow platform is now live!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });