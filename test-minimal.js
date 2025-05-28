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
    expect(await factory.platformFee()).to.equal(250);
  });

  it("Should whitelist tokens", async function () {
    await factory.whitelistToken(await token.getAddress());
    expect(await factory.isTokenWhitelisted(await token.getAddress())).to.be.true;
  });

  it("Should create escrow", async function () {
    const tx = await factory.createEscrow(
      "Property123",
      buyer.address,
      seller.address,
      await token.getAddress(),
      ethers.parseEther("100"),
      Math.floor(Date.now() / 1000) + 86400,
      Math.floor(Date.now() / 1000) + 172800,
      250, 250
    );
    await tx.wait();
    expect(tx).to.be.ok;
  });

  it("Should prevent unauthorized access", async function () {
    await expect(
      factory.connect(buyer).setPlatformFee(500)
    ).to.be.reverted;
  });
});