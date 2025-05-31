/**
 * Shared Test Utilities for Enterprise Escrow Platform
 * Eliminates repeated logic across test files
 */

const { ethers } = require("hardhat");
const { expect } = require("chai");

class TestHelpers {
  /**
   * Deploy standard test contracts with consistent configuration
   */
  static async deployTestContracts() {
    const [deployer, buyer, seller, agent, arbiter, unauthorized] = await ethers.getSigners();

    // Deploy MockERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("Test USDC", "USDC", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();

    // Deploy EscrowFactory
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    const escrowFactory = await EscrowFactory.deploy(deployer.address, 250, agent.address, arbiter.address);
    await escrowFactory.waitForDeployment();

    // Deploy PropertyEscrow for direct testing
    const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
    const propertyEscrow = await PropertyEscrow.deploy(deployer.address, 250);
    await propertyEscrow.waitForDeployment();

    return {
      accounts: { deployer, buyer, seller, agent, arbiter, unauthorized },
      contracts: { mockToken, escrowFactory, propertyEscrow }
    };
  }

  /**
   * Deploy upgradeable test contracts
   */
  static async deployUpgradeableContracts() {
    const { upgrades } = require("hardhat");
    const [deployer, buyer, seller, agent, arbiter, unauthorized] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("Test USDC", "USDC", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();

    const EscrowFactoryUpgradeable = await ethers.getContractFactory("EscrowFactoryUpgradeableSimple");
    const escrowFactory = await upgrades.deployProxy(
      EscrowFactoryUpgradeable,
      [deployer.address, 250],
      { initializer: "initialize" }
    );
    await escrowFactory.waitForDeployment();

    return {
      accounts: { deployer, buyer, seller, agent, arbiter, unauthorized },
      contracts: { mockToken, escrowFactory }
    };
  }

  /**
   * Setup standard test environment with token whitelisting
   */
  static async setupTestEnvironment(contracts, accounts) {
    const { mockToken, escrowFactory } = contracts;
    const { deployer, buyer } = accounts;

    // Whitelist test token
    await escrowFactory.setTokenWhitelist(await mockToken.getAddress(), true);
    
    // Transfer tokens to buyer for testing
    await mockToken.transfer(buyer.address, ethers.parseEther("1000"));
    
    return {
      tokenAddress: await mockToken.getAddress(),
      factoryAddress: await escrowFactory.getAddress()
    };
  }

  /**
   * Create standard escrow parameters for testing
   */
  static getStandardEscrowParams(accounts, tokenAddress, overrides = {}) {
    const { buyer, seller, agent, arbiter } = accounts;
    
    return {
      buyer: buyer.address,
      seller: seller.address,
      agent: agent.address,
      arbiter: arbiter.address,
      tokenAddress: tokenAddress,
      depositAmount: ethers.parseEther("1000"),
      depositDeadline: Math.floor(Date.now() / 1000) + 86400,
      propertyId: "TEST-PROPERTY-001",
      ...overrides
    };
  }

  /**
   * Assert contract deployment with standard checks
   */
  static async assertContractDeployment(contract, expectedOwner, expectedFee = null) {
    expect(await contract.getAddress()).to.not.equal(ethers.ZeroAddress);
    
    if (expectedOwner) {
      expect(await contract.owner()).to.equal(expectedOwner);
    }
    
    if (expectedFee !== null) {
      expect(await contract.platformFee()).to.equal(expectedFee);
    }
  }

  /**
   * Execute standard access control tests
   */
  static async testAccessControl(contract, method, authorizedAccount, unauthorizedAccount, ...args) {
    // Should succeed with authorized account
    await expect(contract.connect(authorizedAccount)[method](...args)).to.not.be.reverted;
    
    // Should fail with unauthorized account
    await expect(contract.connect(unauthorizedAccount)[method](...args))
      .to.be.revertedWith("Ownable: caller is not the owner");
  }

  /**
   * Test token whitelisting functionality
   */
  static async testTokenWhitelisting(factory, owner, token, unauthorized) {
    const tokenAddress = await token.getAddress();
    
    // Initially not whitelisted
    expect(await factory.whitelistedTokens(tokenAddress)).to.be.false;
    
    // Owner can whitelist
    await factory.connect(owner).setTokenWhitelist(tokenAddress, true);
    expect(await factory.whitelistedTokens(tokenAddress)).to.be.true;
    
    // Unauthorized cannot whitelist
    await expect(
      factory.connect(unauthorized).setTokenWhitelist(tokenAddress, false)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    
    // Owner can remove from whitelist
    await factory.connect(owner).setTokenWhitelist(tokenAddress, false);
    expect(await factory.whitelistedTokens(tokenAddress)).to.be.false;
  }

  /**
   * Test event emission with standard patterns
   */
  static async testEventEmission(transaction, eventName, contract, expectedArgs = []) {
    if (expectedArgs.length > 0) {
      await expect(transaction)
        .to.emit(contract, eventName)
        .withArgs(...expectedArgs);
    } else {
      await expect(transaction).to.emit(contract, eventName);
    }
  }

  /**
   * Execute fund transfer and verification
   */
  static async executeTokenTransfer(token, from, to, amount, fromAccount) {
    const initialFromBalance = await token.balanceOf(from);
    const initialToBalance = await token.balanceOf(to);
    
    await token.connect(fromAccount).transfer(to, amount);
    
    expect(await token.balanceOf(from)).to.equal(initialFromBalance - amount);
    expect(await token.balanceOf(to)).to.equal(initialToBalance + amount);
  }

  /**
   * Validate escrow state transitions
   */
  static async validateEscrowState(escrow, escrowId, expectedState) {
    const currentState = await escrow.getEscrowState(escrowId);
    expect(currentState).to.equal(expectedState);
  }
}

module.exports = { TestHelpers };