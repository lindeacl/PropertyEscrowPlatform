const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
require("@nomicfoundation/hardhat-chai-matchers");

describe("EscrowFactoryUpgradeable - Fixed Coverage Tests", function () {
  let escrowFactory, mockToken;
  let deployer, buyer, seller, agent, arbiter, unauthorized;

  beforeEach(async function () {
    [deployer, buyer, seller, agent, arbiter, unauthorized] = await ethers.getSigners();

    // Deploy MockERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Test USDC", "USDC", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();

    // Deploy EscrowFactoryUpgradeableSimple
    const EscrowFactoryUpgradeable = await ethers.getContractFactory("EscrowFactoryUpgradeableSimple");
    escrowFactory = await upgrades.deployProxy(
      EscrowFactoryUpgradeable,
      [deployer.address, 250],
      { initializer: "initialize" }
    );
    await escrowFactory.waitForDeployment();
  });

  describe("Initialization", function () {
    it("Should initialize with correct platform wallet", async function () {
      expect(await escrowFactory.platformWallet()).to.equal(deployer.address);
    });

    it("Should initialize with correct platform fee", async function () {
      expect(await escrowFactory.platformFee()).to.equal(250n);
    });

    it("Should set deployer as owner", async function () {
      expect(await escrowFactory.owner()).to.equal(deployer.address);
    });

    it("Should start with zero escrow count", async function () {
      expect(await escrowFactory.getEscrowCount()).to.equal(0n);
    });

    it("Should reject re-initialization", async function () {
      await expect(
        escrowFactory.initialize(deployer.address, 250)
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("Token Whitelisting", function () {
    it("Should allow owner to whitelist tokens", async function () {
      await escrowFactory.setTokenWhitelist(await mockToken.getAddress(), true);
      expect(await escrowFactory.whitelistedTokens(await mockToken.getAddress())).to.be.true;
    });

    it("Should allow owner to remove tokens from whitelist", async function () {
      await escrowFactory.setTokenWhitelist(await mockToken.getAddress(), true);
      await escrowFactory.setTokenWhitelist(await mockToken.getAddress(), false);
      expect(await escrowFactory.whitelistedTokens(await mockToken.getAddress())).to.be.false;
    });

    it("Should reject token whitelisting from non-owner", async function () {
      await expect(
        escrowFactory.connect(unauthorized).setTokenWhitelist(await mockToken.getAddress(), true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should emit TokenWhitelisted event", async function () {
      await expect(
        escrowFactory.setTokenWhitelist(await mockToken.getAddress(), true)
      ).to.emit(escrowFactory, "TokenWhitelisted")
        .withArgs(await mockToken.getAddress(), true);
    });
  });

  describe("Escrow Creation", function () {
    beforeEach(async function () {
      await escrowFactory.setTokenWhitelist(await mockToken.getAddress(), true);
    });

    it("Should create escrow with whitelisted token", async function () {
      const tx = await escrowFactory.createEscrow(
        buyer.address,
        seller.address,
        agent.address,
        arbiter.address,
        await mockToken.getAddress(),
        ethers.parseEther("1000"),
        Math.floor(Date.now() / 1000) + 86400,
        "Test Property"
      );
      
      expect(tx).to.not.be.reverted;
      expect(await escrowFactory.getEscrowCount()).to.equal(1n);
    });

    it("Should reject escrow creation with non-whitelisted token", async function () {
      const nonWhitelistedToken = await ethers.getContractFactory("MockERC20")
        .then(f => f.deploy("Non-Whitelisted", "NWL", ethers.parseEther("1000")));
      
      await expect(
        escrowFactory.createEscrow(
          buyer.address,
          seller.address,
          agent.address,
          arbiter.address,
          await nonWhitelistedToken.getAddress(),
          ethers.parseEther("1000"),
          Math.floor(Date.now() / 1000) + 86400,
          "Test Property"
        )
      ).to.be.revertedWith("Token not whitelisted");
    });

    it("Should emit EscrowCreated event", async function () {
      await expect(
        escrowFactory.createEscrow(
          buyer.address,
          seller.address,
          agent.address,
          arbiter.address,
          await mockToken.getAddress(),
          ethers.parseEther("1000"),
          Math.floor(Date.now() / 1000) + 86400,
          "Test Property"
        )
      ).to.emit(escrowFactory, "EscrowCreated");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to whitelist tokens", async function () {
      await expect(
        escrowFactory.connect(buyer).setTokenWhitelist(await mockToken.getAddress(), true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to transfer ownership", async function () {
      await escrowFactory.transferOwnership(buyer.address);
      expect(await escrowFactory.owner()).to.equal(buyer.address);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await escrowFactory.setTokenWhitelist(await mockToken.getAddress(), true);
      await escrowFactory.createEscrow(
        buyer.address,
        seller.address,
        agent.address,
        arbiter.address,
        await mockToken.getAddress(),
        ethers.parseEther("1000"),
        Math.floor(Date.now() / 1000) + 86400,
        "Test Property"
      );
    });

    it("Should return correct escrow count", async function () {
      expect(await escrowFactory.getEscrowCount()).to.equal(1n);
    });

    it("Should return escrow addresses", async function () {
      const escrowAddress = await escrowFactory.escrows(0);
      expect(escrowAddress).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple escrow creation correctly", async function () {
      await escrowFactory.setTokenWhitelist(await mockToken.getAddress(), true);
      
      await escrowFactory.createEscrow(
        buyer.address, seller.address, agent.address, arbiter.address,
        await mockToken.getAddress(), ethers.parseEther("1000"),
        Math.floor(Date.now() / 1000) + 86400, "Property 1"
      );
      
      await escrowFactory.createEscrow(
        buyer.address, seller.address, agent.address, arbiter.address,
        await mockToken.getAddress(), ethers.parseEther("2000"),
        Math.floor(Date.now() / 1000) + 86400, "Property 2"
      );
      
      expect(await escrowFactory.getEscrowCount()).to.equal(2n);
    });

    it("Should handle token whitelist changes correctly", async function () {
      await escrowFactory.setTokenWhitelist(await mockToken.getAddress(), true);
      expect(await escrowFactory.whitelistedTokens(await mockToken.getAddress())).to.be.true;
      
      await escrowFactory.setTokenWhitelist(await mockToken.getAddress(), false);
      expect(await escrowFactory.whitelistedTokens(await mockToken.getAddress())).to.be.false;
    });
  });
});