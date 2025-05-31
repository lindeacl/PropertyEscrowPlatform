const { ethers } = require("hardhat");

async function main() {
  const [owner, buyer, seller, agent, arbiter] = await ethers.getSigners();
  
  // Deploy MockERC20
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy("Test USDC", "USDC", 6);
  await mockToken.waitForDeployment();

  // Deploy EscrowFactory
  const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
  const factory = await EscrowFactory.deploy(
    owner.address,
    250,
    agent.address,
    arbiter.address
  );
  await factory.waitForDeployment();

  // Whitelist token and create escrow
  await factory.whitelistToken(await mockToken.getAddress(), true);
  
  await factory.createEscrow({
    buyer: buyer.address,
    seller: seller.address,
    agent: agent.address,
    arbiter: arbiter.address,
    tokenAddress: await mockToken.getAddress(),
    depositAmount: ethers.parseEther("1000"),
    agentFee: 250,
    arbiterFee: 50,
    platformFee: 250,
    depositDeadline: Math.floor(Date.now() / 1000) + 86400,
    verificationDeadline: Math.floor(Date.now() / 1000) + 172800,
    property: {
      propertyId: "Test Property",
      description: "Test Description",
      salePrice: ethers.parseEther("1000"),
      documentHash: "QmTest123",
      verified: false
    }
  });

  const escrowAddress = await factory.getEscrowContract(0);
  const propertyEscrow = await ethers.getContractAt("PropertyEscrow", escrowAddress);

  // Check roles
  const ADMIN_ROLE = await propertyEscrow.ADMIN_ROLE();
  const AGENT_ROLE = await propertyEscrow.AGENT_ROLE();
  const ARBITER_ROLE = await propertyEscrow.ARBITER_ROLE();
  const DEFAULT_ADMIN_ROLE = await propertyEscrow.DEFAULT_ADMIN_ROLE();

  console.log("=== ROLE ASSIGNMENTS DEBUG ===");
  console.log("Factory address:", await factory.getAddress());
  console.log("Owner address:", owner.address);
  console.log("Agent address:", agent.address);
  console.log("Arbiter address:", arbiter.address);
  console.log("");
  
  console.log("Has DEFAULT_ADMIN_ROLE (factory):", await propertyEscrow.hasRole(DEFAULT_ADMIN_ROLE, await factory.getAddress()));
  console.log("Has ADMIN_ROLE (owner):", await propertyEscrow.hasRole(ADMIN_ROLE, owner.address));
  console.log("Has AGENT_ROLE (agent):", await propertyEscrow.hasRole(AGENT_ROLE, agent.address));
  console.log("Has ARBITER_ROLE (arbiter):", await propertyEscrow.hasRole(ARBITER_ROLE, arbiter.address));
}

main().catch(console.error);