const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Property Escrow Platform - Core Tests", function () {
  let factory, token, escrow;
  let owner, buyer, seller, agent, arbiter;

  beforeEach(async function () {
    [owner, buyer, seller, agent, arbiter] = await ethers.getSigners();
    
    // Deploy Mock Token
    const MockToken = await ethers.getContractFactory("MockERC20");
    token = await MockToken.deploy("Property Token", "PROP", ethers.parseEther("1000000"));
    
    // Deploy Factory
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    factory = await EscrowFactory.deploy(
      owner.address,  // platform wallet
      250,           // 2.5% fee
      agent.address, // default agent
      arbiter.address // default arbiter
    );
  });

  describe("Deployment Tests", function () {
    it("Should deploy factory with correct parameters", async function () {
      expect(await factory.platformWallet()).to.equal(owner.address);
      expect(await factory.platformFee()).to.equal(250);
      expect(await factory.defaultAgent()).to.equal(agent.address);
      expect(await factory.defaultArbiter()).to.equal(arbiter.address);
    });

    it("Should deploy token with correct parameters", async function () {
      expect(await token.name()).to.equal("Property Token");
      expect(await token.symbol()).to.equal("PROP");
      expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000"));
    });
  });

  describe("Token Management", function () {
    it("Should whitelist tokens correctly", async function () {
      await factory.whitelistToken(await token.getAddress());
      expect(await factory.isTokenWhitelisted(await token.getAddress())).to.be.true;
    });

    it("Should prevent non-owners from whitelisting", async function () {
      await expect(
        factory.connect(buyer).whitelistToken(await token.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Escrow Creation", function () {
    beforeEach(async function () {
      await factory.whitelistToken(await token.getAddress());
    });

    it("Should create escrow successfully", async function () {
      const tx = await factory.createEscrow(
        "Property123",
        buyer.address,
        seller.address,
        await token.getAddress(),
        ethers.parseEther("100"),
        Math.floor(Date.now() / 1000) + 86400,
        Math.floor(Date.now() / 1000) + 172800,
        250, // agent fee
        250  // arbiter fee
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("Should fail with non-whitelisted token", async function () {
      const MockToken2 = await ethers.getContractFactory("MockERC20");
      const token2 = await MockToken2.deploy("Bad Token", "BAD", ethers.parseEther("1000"));

      await expect(
        factory.createEscrow(
          "Property123",
          buyer.address,
          seller.address,
          await token2.getAddress(),
          ethers.parseEther("100"),
          Math.floor(Date.now() / 1000) + 86400,
          Math.floor(Date.now() / 1000) + 172800,
          250,
          250
        )
      ).to.be.revertedWith("Token not whitelisted");
    });
  });

  describe("Security Tests", function () {
    it("Should prevent unauthorized access to admin functions", async function () {
      await expect(
        factory.connect(buyer).setPlatformFee(500)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should enforce platform fee limits", async function () {
      await expect(
        factory.setPlatformFee(600) // Over 5% limit
      ).to.be.revertedWith("Platform fee too high");
    });

    it("Should handle zero addresses correctly", async function () {
      await expect(
        factory.whitelistToken(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid token address");
    });
  });
});