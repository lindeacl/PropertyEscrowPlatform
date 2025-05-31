const { expect } = require("chai");
const { ethers } = require("hardhat");
const { TestHelpers } = require("./utils/TestHelpers");
require("@nomicfoundation/hardhat-chai-matchers");

describe("EscrowFactoryUpgradeable - Refactored Tests", function () {
  let testSetup;

  beforeEach(async function () {
    testSetup = await TestHelpers.deployUpgradeableContracts();
  });

  describe("Initialization", function () {
    it("Should initialize with correct platform wallet", async function () {
      const { contracts, accounts } = testSetup;
      await TestHelpers.assertContractDeployment(
        contracts.escrowFactory, 
        accounts.deployer.address, 
        250n
      );
    });

    it("Should reject re-initialization", async function () {
      const { contracts, accounts } = testSetup;
      await expect(
        contracts.escrowFactory.initialize(accounts.deployer.address, 250)
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("Token Whitelisting", function () {
    it("Should handle complete token whitelisting workflow", async function () {
      const { contracts, accounts } = testSetup;
      await TestHelpers.testTokenWhitelisting(
        contracts.escrowFactory,
        accounts.deployer,
        contracts.mockToken,
        accounts.unauthorized
      );
    });

    it("Should emit TokenWhitelisted event", async function () {
      const { contracts, accounts } = testSetup;
      const tokenAddress = await contracts.mockToken.getAddress();
      
      await TestHelpers.testEventEmission(
        contracts.escrowFactory.setTokenWhitelist(tokenAddress, true),
        "TokenWhitelisted",
        contracts.escrowFactory,
        [tokenAddress, true]
      );
    });
  });

  describe("Escrow Creation", function () {
    beforeEach(async function () {
      const { contracts, accounts } = testSetup;
      await TestHelpers.setupTestEnvironment(contracts, accounts);
    });

    it("Should create escrow with whitelisted token", async function () {
      const { contracts, accounts } = testSetup;
      const tokenAddress = await contracts.mockToken.getAddress();
      const params = TestHelpers.getStandardEscrowParams(accounts, tokenAddress);
      
      const tx = await contracts.escrowFactory.createEscrow(
        params.buyer,
        params.seller,
        params.agent,
        params.arbiter,
        params.tokenAddress,
        params.depositAmount,
        params.depositDeadline,
        params.propertyId
      );
      
      expect(tx).to.not.be.reverted;
      expect(await contracts.escrowFactory.getEscrowCount()).to.equal(1n);
    });

    it("Should reject escrow creation with non-whitelisted token", async function () {
      const { contracts, accounts } = testSetup;
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const nonWhitelistedToken = await MockERC20.deploy("Non-Whitelisted", "NWL", ethers.parseEther("1000"));
      
      const params = TestHelpers.getStandardEscrowParams(
        accounts, 
        await nonWhitelistedToken.getAddress()
      );
      
      await expect(
        contracts.escrowFactory.createEscrow(
          params.buyer,
          params.seller,
          params.agent,
          params.arbiter,
          params.tokenAddress,
          params.depositAmount,
          params.depositDeadline,
          params.propertyId
        )
      ).to.be.revertedWith("Token not whitelisted");
    });
  });

  describe("Access Control", function () {
    it("Should enforce access control for token whitelisting", async function () {
      const { contracts, accounts } = testSetup;
      const tokenAddress = await contracts.mockToken.getAddress();
      
      await TestHelpers.testAccessControl(
        contracts.escrowFactory,
        "setTokenWhitelist",
        accounts.deployer,
        accounts.unauthorized,
        tokenAddress,
        true
      );
    });

    it("Should allow owner to transfer ownership", async function () {
      const { contracts, accounts } = testSetup;
      await contracts.escrowFactory.transferOwnership(accounts.buyer.address);
      expect(await contracts.escrowFactory.owner()).to.equal(accounts.buyer.address);
    });
  });

  describe("Edge Cases", function () {
    beforeEach(async function () {
      const { contracts, accounts } = testSetup;
      await TestHelpers.setupTestEnvironment(contracts, accounts);
    });

    it("Should handle multiple escrow creation correctly", async function () {
      const { contracts, accounts } = testSetup;
      const tokenAddress = await contracts.mockToken.getAddress();
      const params = TestHelpers.getStandardEscrowParams(accounts, tokenAddress);
      
      // Create first escrow
      await contracts.escrowFactory.createEscrow(
        params.buyer, params.seller, params.agent, params.arbiter,
        params.tokenAddress, params.depositAmount, params.depositDeadline, "Property 1"
      );
      
      // Create second escrow with different property ID
      await contracts.escrowFactory.createEscrow(
        params.buyer, params.seller, params.agent, params.arbiter,
        params.tokenAddress, ethers.parseEther("2000"), params.depositDeadline, "Property 2"
      );
      
      expect(await contracts.escrowFactory.getEscrowCount()).to.equal(2n);
    });
  });
});