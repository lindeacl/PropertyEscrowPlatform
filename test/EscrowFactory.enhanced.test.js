const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowFactory - Enhanced Coverage Tests", function () {
  let escrowFactory, mockToken;
  let deployer, buyer, seller, agent, arbiter, unauthorized;

  beforeEach(async function () {
    [deployer, buyer, seller, agent, arbiter, unauthorized] = await ethers.getSigners();

    // Deploy MockERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Test USDC", "USDC", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();

    // Deploy EscrowFactory
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    escrowFactory = await EscrowFactory.deploy();
    await escrowFactory.waitForDeployment();
  });

  describe("Token Whitelisting Edge Cases", function () {
    it("Should reject whitelisting zero address", async function () {
      await expect(
        escrowFactory.whitelistToken(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid token address");
    });

    it("Should reject duplicate token whitelisting", async function () {
      await escrowFactory.whitelistToken(await mockToken.getAddress());
      await expect(
        escrowFactory.whitelistToken(await mockToken.getAddress())
      ).to.be.revertedWith("Token already whitelisted");
    });

    it("Should emit TokenWhitelisted event", async function () {
      await expect(escrowFactory.whitelistToken(await mockToken.getAddress()))
        .to.emit(escrowFactory, "TokenWhitelisted")
        .withArgs(await mockToken.getAddress());
    });

    it("Should allow removing tokens from whitelist", async function () {
      await escrowFactory.whitelistToken(await mockToken.getAddress());
      await escrowFactory.removeTokenFromWhitelist(await mockToken.getAddress());
      
      expect(await escrowFactory.isTokenWhitelisted(await mockToken.getAddress())).to.be.false;
    });

    it("Should reject removing non-whitelisted tokens", async function () {
      await expect(
        escrowFactory.removeTokenFromWhitelist(await mockToken.getAddress())
      ).to.be.revertedWith("Token not whitelisted");
    });

    it("Should emit TokenRemoved event", async function () {
      await escrowFactory.whitelistToken(await mockToken.getAddress());
      await expect(escrowFactory.removeTokenFromWhitelist(await mockToken.getAddress()))
        .to.emit(escrowFactory, "TokenRemoved")
        .withArgs(await mockToken.getAddress());
    });
  });

  describe("Escrow Creation Edge Cases", function () {
    beforeEach(async function () {
      await escrowFactory.whitelistToken(await mockToken.getAddress());
    });

    it("Should reject creation with empty property ID", async function () {
      await expect(
        escrowFactory.createEscrow(
          "",
          buyer.address,
          seller.address,
          agent.address,
          arbiter.address,
          await mockToken.getAddress(),
          ethers.parseEther("1000"),
          Math.floor(Date.now() / 1000) + 86400,
          "Test Property"
        )
      ).to.be.revertedWith("Property ID required");
    });

    it("Should reject creation with zero buyer address", async function () {
      await expect(
        escrowFactory.createEscrow(
          "PROP-001",
          ethers.ZeroAddress,
          seller.address,
          agent.address,
          arbiter.address,
          await mockToken.getAddress(),
          ethers.parseEther("1000"),
          Math.floor(Date.now() / 1000) + 86400,
          "Test Property"
        )
      ).to.be.revertedWith("Invalid buyer address");
    });

    it("Should reject creation with zero seller address", async function () {
      await expect(
        escrowFactory.createEscrow(
          "PROP-001",
          buyer.address,
          ethers.ZeroAddress,
          agent.address,
          arbiter.address,
          await mockToken.getAddress(),
          ethers.parseEther("1000"),
          Math.floor(Date.now() / 1000) + 86400,
          "Test Property"
        )
      ).to.be.revertedWith("Invalid seller address");
    });

    it("Should reject creation with zero price", async function () {
      await expect(
        escrowFactory.createEscrow(
          "PROP-001",
          buyer.address,
          seller.address,
          agent.address,
          arbiter.address,
          await mockToken.getAddress(),
          0,
          Math.floor(Date.now() / 1000) + 86400,
          "Test Property"
        )
      ).to.be.revertedWith("Price must be greater than zero");
    });

    it("Should reject creation with past deadline", async function () {
      await expect(
        escrowFactory.createEscrow(
          "PROP-001",
          buyer.address,
          seller.address,
          agent.address,
          arbiter.address,
          await mockToken.getAddress(),
          ethers.parseEther("1000"),
          Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          "Test Property"
        )
      ).to.be.revertedWith("Deadline must be in the future");
    });

    it("Should reject creation with non-whitelisted token", async function () {
      const NonWhitelistedToken = await ethers.getContractFactory("MockERC20");
      const nonWhitelistedToken = await NonWhitelistedToken.deploy("Bad Token", "BAD", ethers.parseEther("1000"));
      
      await expect(
        escrowFactory.createEscrow(
          "PROP-001",
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

    it("Should emit EscrowCreated event with correct parameters", async function () {
      const tx = await escrowFactory.createEscrow(
        "PROP-001",
        buyer.address,
        seller.address,
        agent.address,
        arbiter.address,
        await mockToken.getAddress(),
        ethers.parseEther("1000"),
        Math.floor(Date.now() / 1000) + 86400,
        "Test Property"
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => 
        log.fragment && log.fragment.name === 'EscrowCreated'
      );
      
      expect(event).to.not.be.undefined;
      expect(event.args.propertyId).to.equal("PROP-001");
      expect(event.args.buyer).to.equal(buyer.address);
      expect(event.args.seller).to.equal(seller.address);
    });

    it("Should increment escrow count correctly", async function () {
      const countBefore = await escrowFactory.escrowCount();
      
      await escrowFactory.createEscrow(
        "PROP-001",
        buyer.address,
        seller.address,
        agent.address,
        arbiter.address,
        await mockToken.getAddress(),
        ethers.parseEther("1000"),
        Math.floor(Date.now() / 1000) + 86400,
        "Test Property"
      );

      const countAfter = await escrowFactory.escrowCount();
      expect(countAfter).to.equal(countBefore + 1n);
    });

    it("Should allow creation without agent (zero address)", async function () {
      await expect(
        escrowFactory.createEscrow(
          "PROP-001",
          buyer.address,
          seller.address,
          ethers.ZeroAddress, // No agent
          arbiter.address,
          await mockToken.getAddress(),
          ethers.parseEther("1000"),
          Math.floor(Date.now() / 1000) + 86400,
          "Test Property"
        )
      ).to.not.be.reverted;
    });

    it("Should store escrow address correctly", async function () {
      await escrowFactory.createEscrow(
        "PROP-001",
        buyer.address,
        seller.address,
        agent.address,
        arbiter.address,
        await mockToken.getAddress(),
        ethers.parseEther("1000"),
        Math.floor(Date.now() / 1000) + 86400,
        "Test Property"
      );

      const escrowAddress = await escrowFactory.escrows(0);
      expect(escrowAddress).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Access Control Functions", function () {
    it("Should allow owner to transfer ownership", async function () {
      await escrowFactory.transferOwnership(buyer.address);
      expect(await escrowFactory.owner()).to.equal(buyer.address);
    });

    it("Should reject ownership transfer from non-owner", async function () {
      await expect(
        escrowFactory.connect(unauthorized).transferOwnership(buyer.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject renouncing ownership from non-owner", async function () {
      await expect(
        escrowFactory.connect(unauthorized).renounceOwnership()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await escrowFactory.whitelistToken(await mockToken.getAddress());
    });

    it("Should return correct escrow count", async function () {
      const initialCount = await escrowFactory.escrowCount();
      expect(initialCount).to.equal(0);

      await escrowFactory.createEscrow(
        "PROP-001",
        buyer.address,
        seller.address,
        agent.address,
        arbiter.address,
        await mockToken.getAddress(),
        ethers.parseEther("1000"),
        Math.floor(Date.now() / 1000) + 86400,
        "Test Property"
      );

      const finalCount = await escrowFactory.escrowCount();
      expect(finalCount).to.equal(1);
    });

    it("Should return correct token whitelist status", async function () {
      expect(await escrowFactory.isTokenWhitelisted(await mockToken.getAddress())).to.be.true;
      
      const NonWhitelistedToken = await ethers.getContractFactory("MockERC20");
      const nonWhitelistedToken = await NonWhitelistedToken.deploy("Bad Token", "BAD", ethers.parseEther("1000"));
      
      expect(await escrowFactory.isTokenWhitelisted(await nonWhitelistedToken.getAddress())).to.be.false;
    });

    it("Should return zero address for non-existent escrow", async function () {
      const escrowAddress = await escrowFactory.escrows(999);
      expect(escrowAddress).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to pause factory", async function () {
      await escrowFactory.pause();
      expect(await escrowFactory.paused()).to.be.true;
    });

    it("Should prevent escrow creation when paused", async function () {
      await escrowFactory.whitelistToken(await mockToken.getAddress());
      await escrowFactory.pause();

      await expect(
        escrowFactory.createEscrow(
          "PROP-001",
          buyer.address,
          seller.address,
          agent.address,
          arbiter.address,
          await mockToken.getAddress(),
          ethers.parseEther("1000"),
          Math.floor(Date.now() / 1000) + 86400,
          "Test Property"
        )
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow owner to unpause factory", async function () {
      await escrowFactory.pause();
      await escrowFactory.unpause();
      expect(await escrowFactory.paused()).to.be.false;
    });
  });
});