const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Working Escrow Platform Tests", function () {
  let escrowFactory, propertyEscrow, mockToken;
  let deployer, buyer, seller, agent, arbiter;

  beforeEach(async function () {
    [deployer, buyer, seller, agent, arbiter] = await ethers.getSigners();

    // Deploy MockERC20 - matches deployed version
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("USD Coin", "USDC", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();

    // Deploy PropertyEscrow - matches deployed version
    const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
    propertyEscrow = await PropertyEscrow.deploy(deployer.address, 250);
    await propertyEscrow.waitForDeployment();

    // Deploy EscrowFactory - matches deployed version
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    escrowFactory = await EscrowFactory.deploy(
      deployer.address,
      250,
      agent.address,
      arbiter.address
    );
    await escrowFactory.waitForDeployment();

    // Setup
    await mockToken.mint(buyer.address, ethers.parseEther("10000"));
    await escrowFactory.whitelistToken(await mockToken.getAddress(), true);
    await propertyEscrow.whitelistToken(await mockToken.getAddress(), true);
  });

  describe("EscrowFactory Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await escrowFactory.platformWallet()).to.equal(deployer.address);
    });

    it("Should whitelist tokens", async function () {
      const tokenAddress = await mockToken.getAddress();
      expect(await escrowFactory.isTokenWhitelisted(tokenAddress)).to.be.true;
    });
  });

  describe("PropertyEscrow Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await propertyEscrow.platformWallet()).to.equal(deployer.address);
    });
  });

  describe("MockERC20 Token", function () {
    it("Should have correct properties", async function () {
      expect(await mockToken.name()).to.equal("USD Coin");
      expect(await mockToken.symbol()).to.equal("USDC");
      expect(await mockToken.decimals()).to.equal(18);
    });

    it("Should handle transfers", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(buyer).transfer(seller.address, amount);
      expect(await mockToken.balanceOf(seller.address)).to.equal(amount);
    });
  });
});