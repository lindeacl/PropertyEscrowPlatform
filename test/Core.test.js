const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Core Escrow Platform Tests", function () {
  let escrowFactory, propertyEscrow, mockToken;
  let deployer, buyer, seller, agent, arbiter;

  beforeEach(async function () {
    [deployer, buyer, seller, agent, arbiter] = await ethers.getSigners();

    // Deploy MockERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockToken.waitForDeployment();

    // Deploy PropertyEscrow
    const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
    propertyEscrow = await PropertyEscrow.deploy(deployer.address, 250);
    await propertyEscrow.waitForDeployment();

    // Deploy EscrowFactory
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    escrowFactory = await EscrowFactory.deploy(
      deployer.address, // platform wallet
      250, // platform fee
      agent.address, // default agent
      arbiter.address // default arbiter
    );
    await escrowFactory.waitForDeployment();

    // Setup tokens
    await mockToken.mint(buyer.address, ethers.parseUnits("10000", 6));
    await escrowFactory.whitelistToken(await mockToken.getAddress(), true);
    await propertyEscrow.whitelistToken(await mockToken.getAddress(), true);
  });

  describe("EscrowFactory", function () {
    it("Should deploy with correct configuration", async function () {
      expect(await escrowFactory.platformWallet()).to.equal(deployer.address);
      expect(await escrowFactory.getPlatformFee()).to.equal(250);
      expect(await escrowFactory.getDefaultAgent()).to.equal(agent.address);
      expect(await escrowFactory.getDefaultArbiter()).to.equal(arbiter.address);
    });

    it("Should whitelist tokens correctly", async function () {
      const tokenAddress = await mockToken.getAddress();
      expect(await escrowFactory.isTokenWhitelisted(tokenAddress)).to.be.true;
    });

    it("Should create escrow successfully", async function () {
      const escrowParams = {
        buyer: buyer.address,
        seller: seller.address,
        agent: agent.address,
        arbiter: arbiter.address,
        tokenAddress: await mockToken.getAddress(),
        depositAmount: ethers.parseUnits("1000", 6),
        depositDeadline: Math.floor(Date.now() / 1000) + 86400,
        propertyId: "PROP-2024-001",
        platformFee: 250
      };

      const tx = await escrowFactory.createEscrow(escrowParams);
      const receipt = await tx.wait();
      
      expect(receipt.status).to.equal(1);
    });
  });

  describe("PropertyEscrow", function () {
    beforeEach(async function () {
      // Grant roles for testing
      await propertyEscrow.grantRole(await propertyEscrow.AGENT_ROLE(), agent.address);
      await propertyEscrow.grantRole(await propertyEscrow.ARBITER_ROLE(), arbiter.address);
    });

    it("Should deploy with correct configuration", async function () {
      expect(await propertyEscrow.platformWallet()).to.equal(deployer.address);
      expect(await propertyEscrow.platformFee()).to.equal(250);
    });

    it("Should create escrow with valid parameters", async function () {
      const escrowParams = {
        buyer: buyer.address,
        seller: seller.address,
        agent: agent.address,
        arbiter: arbiter.address,
        tokenAddress: await mockToken.getAddress(),
        depositAmount: ethers.parseUnits("1000", 6),
        depositDeadline: Math.floor(Date.now() / 1000) + 86400,
        propertyId: "PROP-2024-001",
        platformFee: 250
      };

      await expect(propertyEscrow.createEscrow(escrowParams))
        .to.emit(propertyEscrow, "EscrowCreated");
    });

    it("Should handle deposit workflow", async function () {
      // Create escrow first
      const escrowParams = {
        buyer: buyer.address,
        seller: seller.address,
        agent: agent.address,
        arbiter: arbiter.address,
        tokenAddress: await mockToken.getAddress(),
        depositAmount: ethers.parseUnits("1000", 6),
        depositDeadline: Math.floor(Date.now() / 1000) + 86400,
        propertyId: "PROP-2024-001",
        platformFee: 250
      };

      await propertyEscrow.createEscrow(escrowParams);

      // Approve tokens
      await mockToken.connect(buyer).approve(
        await propertyEscrow.getAddress(), 
        ethers.parseUnits("1000", 6)
      );

      // Deposit funds
      await expect(propertyEscrow.connect(buyer).depositFunds(0))
        .to.emit(propertyEscrow, "FundsDeposited");
    });

    it("Should handle verification workflow", async function () {
      // Create and fund escrow
      const escrowParams = {
        buyer: buyer.address,
        seller: seller.address,
        agent: agent.address,
        arbiter: arbiter.address,
        tokenAddress: await mockToken.getAddress(),
        depositAmount: ethers.parseUnits("1000", 6),
        depositDeadline: Math.floor(Date.now() / 1000) + 86400,
        propertyId: "PROP-2024-001",
        platformFee: 250
      };

      await propertyEscrow.createEscrow(escrowParams);
      await mockToken.connect(buyer).approve(
        await propertyEscrow.getAddress(), 
        ethers.parseUnits("1000", 6)
      );
      await propertyEscrow.connect(buyer).depositFunds(0);

      // Complete verification
      await expect(propertyEscrow.connect(agent).completeVerification(0))
        .to.emit(propertyEscrow, "VerificationCompleted");
    });
  });

  describe("MockERC20", function () {
    it("Should have correct token properties", async function () {
      expect(await mockToken.name()).to.equal("USD Coin");
      expect(await mockToken.symbol()).to.equal("USDC");
      expect(await mockToken.decimals()).to.equal(6);
    });

    it("Should allow minting and transfers", async function () {
      const mintAmount = ethers.parseUnits("1000", 6);
      await mockToken.mint(buyer.address, mintAmount);
      
      expect(await mockToken.balanceOf(buyer.address)).to.equal(mintAmount);
      
      await mockToken.connect(buyer).transfer(seller.address, ethers.parseUnits("100", 6));
      expect(await mockToken.balanceOf(seller.address)).to.equal(ethers.parseUnits("100", 6));
    });
  });
});