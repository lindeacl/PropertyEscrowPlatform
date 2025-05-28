const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("EscrowFactory", function () {
  async function deployFactoryFixture() {
    const [owner, agent, arbiter, platformWallet, buyer, seller, other] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    const token = await MockToken.deploy("Test Token", "TEST", ethers.utils.parseEther("1000000"));

    // Deploy EscrowFactory
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    const platformFee = 150; // 1.5%
    const factory = await EscrowFactory.deploy(
      platformWallet.address,
      platformFee,
      agent.address,
      arbiter.address
    );

    // Whitelist the token
    await factory.whitelistToken(token.address, true);

    // Mint tokens to buyer
    const depositAmount = ethers.utils.parseEther("100");
    await token.transfer(buyer.address, depositAmount.mul(2));

    const property = {
      propertyId: "PROP001",
      description: "Test Property",
      salePrice: depositAmount,
      documentHash: "QmTestHash",
      verified: false
    };

    const createEscrowParams = {
      buyer: buyer.address,
      seller: seller.address,
      agent: ethers.constants.AddressZero, // Will use default
      arbiter: ethers.constants.AddressZero, // Will use default
      tokenAddress: token.address,
      depositAmount: depositAmount,
      agentFee: ethers.utils.parseEther("5"),
      platformFee: 0, // Will use default
      property: property,
      depositDeadline: Math.floor(Date.now() / 1000) + 86400,
      verificationDeadline: Math.floor(Date.now() / 1000) + 172800
    };

    return {
      factory,
      token,
      owner,
      agent,
      arbiter,
      platformWallet,
      buyer,
      seller,
      other,
      createEscrowParams,
      depositAmount,
      platformFee
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      const { factory, platformWallet, agent, arbiter, platformFee } = await loadFixture(deployFactoryFixture);
      
      expect(await factory.platformWallet()).to.equal(platformWallet.address);
      expect(await factory.getPlatformFee()).to.equal(platformFee);
      expect(await factory.getDefaultAgent()).to.equal(agent.address);
      expect(await factory.getDefaultArbiter()).to.equal(arbiter.address);
      expect(await factory.getTotalEscrowContracts()).to.equal(0);
    });

    it("Should reject invalid constructor parameters", async function () {
      const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
      const [owner, agent, arbiter] = await ethers.getSigners();

      // Invalid platform wallet
      await expect(
        EscrowFactory.deploy(ethers.constants.AddressZero, 100, agent.address, arbiter.address)
      ).to.be.revertedWith("Invalid platform wallet");

      // Platform fee too high
      await expect(
        EscrowFactory.deploy(owner.address, 600, agent.address, arbiter.address)
      ).to.be.revertedWith("Platform fee too high");
    });
  });

  describe("Token Whitelisting", function () {
    it("Should allow owner to whitelist tokens", async function () {
      const { factory, token, owner } = await loadFixture(deployFactoryFixture);

      expect(await factory.isTokenWhitelisted(token.address)).to.be.true;

      await expect(factory.connect(owner).whitelistToken(token.address, false))
        .to.emit(factory, "TokenWhitelisted")
        .withArgs(token.address, false);

      expect(await factory.isTokenWhitelisted(token.address)).to.be.false;
    });

    it("Should reject non-owner trying to whitelist", async function () {
      const { factory, token, other } = await loadFixture(deployFactoryFixture);

      await expect(factory.connect(other).whitelistToken(token.address, false))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject zero address token", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);

      await expect(factory.connect(owner).whitelistToken(ethers.constants.AddressZero, true))
        .to.be.revertedWith("Invalid token address");
    });
  });

  describe("Escrow Creation", function () {
    it("Should create escrow successfully with defaults", async function () {
      const { factory, createEscrowParams, agent, arbiter } = await loadFixture(deployFactoryFixture);

      await expect(factory.createEscrow(createEscrowParams))
        .to.emit(factory, "EscrowContractDeployed");

      expect(await factory.getTotalEscrowContracts()).to.equal(1);

      const escrowContractAddress = await factory.getEscrowContract(0);
      expect(escrowContractAddress).to.not.equal(ethers.constants.AddressZero);

      // Verify the escrow contract was created correctly
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const escrowContract = PropertyEscrow.attach(escrowContractAddress);
      
      // Check that the escrow was created in the new contract
      const escrowData = await escrowContract.getEscrow(0);
      expect(escrowData.buyer).to.equal(createEscrowParams.buyer);
      expect(escrowData.seller).to.equal(createEscrowParams.seller);
      expect(escrowData.agent).to.equal(agent.address); // Should use default
      expect(escrowData.arbiter).to.equal(arbiter.address); // Should use default
    });

    it("Should create escrow with custom agent and arbiter", async function () {
      const { factory, createEscrowParams, other } = await loadFixture(deployFactoryFixture);

      const customParams = {
        ...createEscrowParams,
        agent: other.address,
        arbiter: other.address
      };

      await factory.createEscrow(customParams);

      const escrowContractAddress = await factory.getEscrowContract(0);
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const escrowContract = PropertyEscrow.attach(escrowContractAddress);
      
      const escrowData = await escrowContract.getEscrow(0);
      expect(escrowData.agent).to.equal(other.address);
      expect(escrowData.arbiter).to.equal(other.address);
    });

    it("Should fail with non-whitelisted token", async function () {
      const { factory, createEscrowParams } = await loadFixture(deployFactoryFixture);

      // Deploy another token that's not whitelisted
      const MockToken = await ethers.getContractFactory("MockERC20");
      const nonWhitelistedToken = await MockToken.deploy("Bad Token", "BAD", ethers.utils.parseEther("1000"));

      const invalidParams = {
        ...createEscrowParams,
        tokenAddress: nonWhitelistedToken.address
      };

      await expect(factory.createEscrow(invalidParams))
        .to.be.revertedWith("Token not whitelisted");
    });

    it("Should create multiple escrows", async function () {
      const { factory, createEscrowParams } = await loadFixture(deployFactoryFixture);

      // Create first escrow
      await factory.createEscrow(createEscrowParams);
      
      // Create second escrow with different property ID
      const secondParams = {
        ...createEscrowParams,
        property: {
          ...createEscrowParams.property,
          propertyId: "PROP002"
        }
      };
      await factory.createEscrow(secondParams);

      expect(await factory.getTotalEscrowContracts()).to.equal(2);

      const firstEscrowAddress = await factory.getEscrowContract(0);
      const secondEscrowAddress = await factory.getEscrowContract(1);
      
      expect(firstEscrowAddress).to.not.equal(secondEscrowAddress);
    });
  });

  describe("Administrative Functions", function () {
    it("Should allow owner to set default agent", async function () {
      const { factory, owner, other } = await loadFixture(deployFactoryFixture);

      await expect(factory.connect(owner).setDefaultAgent(other.address))
        .to.emit(factory, "DefaultAgentSet")
        .withArgs(other.address);

      expect(await factory.getDefaultAgent()).to.equal(other.address);
    });

    it("Should allow owner to set default arbiter", async function () {
      const { factory, owner, other } = await loadFixture(deployFactoryFixture);

      await expect(factory.connect(owner).setDefaultArbiter(other.address))
        .to.emit(factory, "DefaultArbiterSet")
        .withArgs(other.address);

      expect(await factory.getDefaultArbiter()).to.equal(other.address);
    });

    it("Should allow owner to set platform fee", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);

      const newFee = 200; // 2%
      await expect(factory.connect(owner).setPlatformFee(newFee))
        .to.emit(factory, "PlatformFeeUpdated")
        .withArgs(newFee);

      expect(await factory.getPlatformFee()).to.equal(newFee);
    });

    it("Should reject platform fee that's too high", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);

      await expect(factory.connect(owner).setPlatformFee(600))
        .to.be.revertedWith("Fee too high");
    });

    it("Should reject non-owner trying to change settings", async function () {
      const { factory, other } = await loadFixture(deployFactoryFixture);

      await expect(factory.connect(other).setDefaultAgent(other.address))
        .to.be.revertedWith("Ownable: caller is not the owner");

      await expect(factory.connect(other).setDefaultArbiter(other.address))
        .to.be.revertedWith("Ownable: caller is not the owner");

      await expect(factory.connect(other).setPlatformFee(200))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    it("Should return correct escrow contract address", async function () {
      const { factory, createEscrowParams } = await loadFixture(deployFactoryFixture);

      await factory.createEscrow(createEscrowParams);
      
      const escrowAddress = await factory.getEscrowContract(0);
      expect(escrowAddress).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should revert for invalid escrow ID", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      await expect(factory.getEscrowContract(0))
        .to.be.revertedWith("Invalid escrow ID");
    });

    it("Should return correct token whitelist status", async function () {
      const { factory, token } = await loadFixture(deployFactoryFixture);

      expect(await factory.isTokenWhitelisted(token.address)).to.be.true;
      
      // Test with random address
      expect(await factory.isTokenWhitelisted(ethers.constants.AddressZero)).to.be.false;
    });
  });
});
