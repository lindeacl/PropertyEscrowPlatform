const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Property Escrow Platform - Critical Tests", function () {
  let factory, token;
  let owner, buyer, seller, agent, arbiter;

  before(async function () {
    [owner, buyer, seller, agent, arbiter] = await ethers.getSigners();
    
    // Deploy Mock Token
    const MockToken = await ethers.getContractFactory("MockERC20");
    token = await MockToken.deploy("Property Token", "PROP", ethers.parseEther("1000000"));
    await token.waitForDeployment();
    
    // Deploy Factory
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    factory = await EscrowFactory.deploy(
      owner.address,  // platform wallet
      250,           // 2.5% fee
      agent.address, // default agent
      arbiter.address // default arbiter
    );
    await factory.waitForDeployment();
  });

  it("Should deploy factory correctly", async function () {
    expect(await factory.platformWallet()).to.equal(owner.address);
    expect(await factory.getDefaultAgent()).to.equal(agent.address);
    expect(await factory.getDefaultArbiter()).to.equal(arbiter.address);
  });

  it("Should whitelist tokens", async function () {
    await factory.whitelistToken(await token.getAddress(), true);
    expect(await factory.isTokenWhitelisted(await token.getAddress())).to.be.true;
  });

  it("Should create escrow", async function () {
    const params = {
      buyer: buyer.address,
      seller: seller.address,
      agent: agent.address,
      arbiter: arbiter.address,
      tokenAddress: await token.getAddress(),
      depositAmount: ethers.parseEther("100"),
      agentFee: 250,
      platformFee: 250,
      property: {
        propertyId: "Property123",
        description: "123 Main St",
        salePrice: ethers.parseEther("100"),
        documentHash: "QmTest123",
        verified: false
      },
      depositDeadline: Math.floor(Date.now() / 1000) + 86400,
      verificationDeadline: Math.floor(Date.now() / 1000) + 172800
    };
    
    const tx = await factory.createEscrow(params);
    await tx.wait();
    expect(tx).to.be.ok;
  });

  it("Should prevent unauthorized access", async function () {
    await expect(
      factory.connect(buyer).setPlatformFee(500)
    ).to.be.reverted;
  });
});