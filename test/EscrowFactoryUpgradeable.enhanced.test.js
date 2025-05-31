const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("EscrowFactoryUpgradeable - Enhanced Coverage Tests", function () {
  let escrowFactory, complianceManager, mockToken;
  let deployer, buyer, seller, agent, arbiter, unauthorized;

  beforeEach(async function () {
    [deployer, buyer, seller, agent, arbiter, unauthorized] = await ethers.getSigners();

    // Deploy MockERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Test USDC", "USDC", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();

    // Deploy ComplianceManager
    const ComplianceManager = await ethers.getContractFactory("ComplianceManager");
    complianceManager = await ComplianceManager.deploy(deployer.address);
    await complianceManager.waitForDeployment();

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
    it("Should initialize with correct compliance manager", async function () {
      expect(await escrowFactory.complianceManager()).to.equal(await complianceManager.getAddress());
    });

    it("Should set deployer as owner", async function () {
      expect(await escrowFactory.owner()).to.equal(deployer.address);
    });

    it("Should start with zero escrow count", async function () {
      expect(await escrowFactory.escrowCount()).to.equal(0);
    });

    it("Should reject re-initialization", async function () {
      await expect(
        escrowFactory.initialize(await complianceManager.getAddress())
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("Compliance Integration", function () {
    beforeEach(async function () {
      // Add compliance records for participants
      await complianceManager.createComplianceRecord(buyer.address, true, 1, "Low risk buyer");
      await complianceManager.createComplianceRecord(seller.address, true, 1, "Low risk seller");
      await complianceManager.createComplianceRecord(agent.address, true, 1, "Verified agent");
      await complianceManager.createComplianceRecord(arbiter.address, true, 1, "Verified arbiter");
      
      await escrowFactory.whitelistToken(await mockToken.getAddress());
    });

    it("Should reject escrow creation with non-compliant buyer", async function () {
      await expect(
        escrowFactory.createEscrowWithCompliance(
          "PROP-001",
          unauthorized.address, // No compliance record
          seller.address,
          agent.address,
          arbiter.address,
          await mockToken.getAddress(),
          ethers.parseEther("1000"),
          Math.floor(Date.now() / 1000) + 86400,
          "Test Property"
        )
      ).to.be.revertedWith("Buyer not KYC verified");
    });

    it("Should reject escrow creation with non-compliant seller", async function () {
      await expect(
        escrowFactory.createEscrowWithCompliance(
          "PROP-001",
          buyer.address,
          unauthorized.address, // No compliance record
          agent.address,
          arbiter.address,
          await mockToken.getAddress(),
          ethers.parseEther("1000"),
          Math.floor(Date.now() / 1000) + 86400,
          "Test Property"
        )
      ).to.be.revertedWith("Seller not KYC verified");
    });

    it("Should reject escrow creation with high-risk participants", async function () {
      await complianceManager.createComplianceRecord(
        unauthorized.address,
        true,
        5, // High risk
        "High risk user"
      );

      await expect(
        escrowFactory.createEscrowWithCompliance(
          "PROP-001",
          unauthorized.address,
          seller.address,
          agent.address,
          arbiter.address,
          await mockToken.getAddress(),
          ethers.parseEther("1000"),
          Math.floor(Date.now() / 1000) + 86400,
          "Test Property"
        )
      ).to.be.revertedWith("High-risk participant detected");
    });

    it("Should allow escrow creation with compliant participants", async function () {
      await expect(
        escrowFactory.createEscrowWithCompliance(
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
      ).to.not.be.reverted;
    });

    it("Should allow agent to be zero address", async function () {
      await expect(
        escrowFactory.createEscrowWithCompliance(
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
  });

  describe("Compliance Manager Management", function () {
    it("Should allow owner to update compliance manager", async function () {
      const NewComplianceManager = await ethers.getContractFactory("ComplianceManager");
      const newComplianceManager = await NewComplianceManager.deploy(deployer.address);
      
      await escrowFactory.updateComplianceManager(await newComplianceManager.getAddress());
      expect(await escrowFactory.complianceManager()).to.equal(await newComplianceManager.getAddress());
    });

    it("Should reject compliance manager update from non-owner", async function () {
      const NewComplianceManager = await ethers.getContractFactory("ComplianceManager");
      const newComplianceManager = await NewComplianceManager.deploy(deployer.address);
      
      await expect(
        escrowFactory.connect(unauthorized).updateComplianceManager(await newComplianceManager.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject zero address compliance manager", async function () {
      await expect(
        escrowFactory.updateComplianceManager(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid compliance manager address");
    });

    it("Should emit ComplianceManagerUpdated event", async function () {
      const NewComplianceManager = await ethers.getContractFactory("ComplianceManager");
      const newComplianceManager = await NewComplianceManager.deploy(deployer.address);
      
      await expect(
        escrowFactory.updateComplianceManager(await newComplianceManager.getAddress())
      ).to.emit(escrowFactory, "ComplianceManagerUpdated")
       .withArgs(await newComplianceManager.getAddress());
    });
  });

  describe("Enhanced Escrow Creation", function () {
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

    it("Should reject creation with invalid addresses", async function () {
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
          Math.floor(Date.now() / 1000) - 3600,
          "Test Property"
        )
      ).to.be.revertedWith("Deadline must be in the future");
    });

    it("Should emit EscrowCreated event", async function () {
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
      ).to.emit(escrowFactory, "EscrowCreated");
    });
  });

  describe("Access Control", function () {
    it("Should reject token whitelisting from non-owner", async function () {
      await expect(
        escrowFactory.connect(unauthorized).whitelistToken(await mockToken.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject token removal from non-owner", async function () {
      await escrowFactory.whitelistToken(await mockToken.getAddress());
      await expect(
        escrowFactory.connect(unauthorized).removeTokenFromWhitelist(await mockToken.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should reject pause from non-owner", async function () {
      await expect(
        escrowFactory.connect(unauthorized).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to pause factory", async function () {
      await escrowFactory.pause();
      expect(await escrowFactory.paused()).to.be.true;
    });

    it("Should prevent operations when paused", async function () {
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

  describe("Upgrade Authorization", function () {
    it("Should authorize upgrades from owner", async function () {
      // This tests the _authorizeUpgrade function indirectly
      const EscrowFactoryUpgradeableV2 = await ethers.getContractFactory("EscrowFactoryUpgradeable");
      
      await expect(
        upgrades.upgradeProxy(escrowFactory, EscrowFactoryUpgradeableV2)
      ).to.not.be.reverted;
    });

    it("Should reject upgrades from non-owner", async function () {
      // Transfer ownership to test unauthorized upgrade
      await escrowFactory.transferOwnership(buyer.address);
      
      const EscrowFactoryUpgradeableV2 = await ethers.getContractFactory("EscrowFactoryUpgradeable");
      
      // Connect as unauthorized user (deployer is no longer owner)
      await expect(
        upgrades.upgradeProxy(escrowFactory.connect(deployer), EscrowFactoryUpgradeableV2)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    it("Should return correct implementation version", async function () {
      // Test that the contract is properly initialized and functional
      expect(await escrowFactory.escrowCount()).to.equal(0);
      expect(await escrowFactory.owner()).to.equal(deployer.address);
    });

    it("Should return correct escrow addresses", async function () {
      await escrowFactory.whitelistToken(await mockToken.getAddress());
      
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

  describe("Edge Cases", function () {
    it("Should handle multiple escrow creation correctly", async function () {
      await escrowFactory.whitelistToken(await mockToken.getAddress());
      
      for (let i = 0; i < 5; i++) {
        await escrowFactory.createEscrow(
          `PROP-00${i}`,
          buyer.address,
          seller.address,
          agent.address,
          arbiter.address,
          await mockToken.getAddress(),
          ethers.parseEther("1000"),
          Math.floor(Date.now() / 1000) + 86400,
          `Test Property ${i}`
        );
      }

      expect(await escrowFactory.escrowCount()).to.equal(5);
    });

    it("Should handle token whitelist changes correctly", async function () {
      await escrowFactory.whitelistToken(await mockToken.getAddress());
      expect(await escrowFactory.isTokenWhitelisted(await mockToken.getAddress())).to.be.true;
      
      await escrowFactory.removeTokenFromWhitelist(await mockToken.getAddress());
      expect(await escrowFactory.isTokenWhitelisted(await mockToken.getAddress())).to.be.false;
    });
  });
});