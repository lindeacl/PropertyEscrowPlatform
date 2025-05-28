const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PropertyEscrow", function () {
  // Fixture to deploy contracts and set up test environment
  async function deployEscrowFixture() {
    const [owner, buyer, seller, agent, arbiter, platformWallet, other] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    const token = await MockToken.deploy("Test Token", "TEST", ethers.utils.parseEther("1000000"));

    // Deploy PropertyEscrow
    const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
    const platformFee = 100; // 1%
    const escrow = await PropertyEscrow.deploy(platformWallet.address, platformFee);

    // Whitelist the token
    await escrow.whitelistToken(token.address, true);

    // Grant roles
    await escrow.grantRole(await escrow.AGENT_ROLE(), agent.address);
    await escrow.grantRole(await escrow.ARBITER_ROLE(), arbiter.address);

    // Mint tokens to buyer
    const depositAmount = ethers.utils.parseEther("100");
    await token.transfer(buyer.address, depositAmount.mul(2));

    // Approve escrow contract to spend buyer's tokens
    await token.connect(buyer).approve(escrow.address, depositAmount.mul(2));

    const property = {
      propertyId: "PROP001",
      description: "Test Property",
      salePrice: depositAmount,
      documentHash: "QmTestHash",
      verified: false
    };

    const depositDeadline = (await time.latest()) + 86400; // 24 hours
    const verificationDeadline = depositDeadline + 86400; // 48 hours total

    const createEscrowParams = {
      buyer: buyer.address,
      seller: seller.address,
      agent: agent.address,
      arbiter: arbiter.address,
      tokenAddress: token.address,
      depositAmount: depositAmount,
      agentFee: ethers.utils.parseEther("5"),
      platformFee: platformFee,
      property: property,
      depositDeadline: depositDeadline,
      verificationDeadline: verificationDeadline
    };

    return {
      escrow,
      token,
      owner,
      buyer,
      seller,
      agent,
      arbiter,
      platformWallet,
      other,
      createEscrowParams,
      depositAmount,
      property
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      const { escrow, platformWallet } = await loadFixture(deployEscrowFixture);
      
      expect(await escrow.platformWallet()).to.equal(platformWallet.address);
      expect(await escrow.platformFeePercentage()).to.equal(100);
      expect(await escrow.getTotalEscrows()).to.equal(0);
    });

    it("Should set up roles correctly", async function () {
      const { escrow, owner, agent, arbiter } = await loadFixture(deployEscrowFixture);
      
      expect(await escrow.hasRole(await escrow.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await escrow.hasRole(await escrow.ADMIN_ROLE(), owner.address)).to.be.true;
      expect(await escrow.hasRole(await escrow.AGENT_ROLE(), agent.address)).to.be.true;
      expect(await escrow.hasRole(await escrow.ARBITER_ROLE(), arbiter.address)).to.be.true;
    });
  });

  describe("Escrow Creation", function () {
    it("Should create escrow successfully", async function () {
      const { escrow, createEscrowParams, buyer, seller, depositAmount } = await loadFixture(deployEscrowFixture);

      await expect(escrow.createEscrow(createEscrowParams))
        .to.emit(escrow, "EscrowCreated")
        .withArgs(0, buyer.address, seller.address, depositAmount);

      const escrowData = await escrow.getEscrow(0);
      expect(escrowData.buyer).to.equal(buyer.address);
      expect(escrowData.seller).to.equal(seller.address);
      expect(escrowData.state).to.equal(0); // Created state
      expect(await escrow.getTotalEscrows()).to.equal(1);
    });

    it("Should fail with invalid parameters", async function () {
      const { escrow, createEscrowParams } = await loadFixture(deployEscrowFixture);

      // Invalid buyer address
      const invalidParams = { ...createEscrowParams, buyer: ethers.constants.AddressZero };
      await expect(escrow.createEscrow(invalidParams))
        .to.be.revertedWith("Invalid buyer address");

      // Buyer and seller same
      const sameAddressParams = { ...createEscrowParams, seller: createEscrowParams.buyer };
      await expect(escrow.createEscrow(sameAddressParams))
        .to.be.revertedWith("Buyer and seller must be different");

      // Zero deposit amount
      const zeroDepositParams = { ...createEscrowParams, depositAmount: 0 };
      await expect(escrow.createEscrow(zeroDepositParams))
        .to.be.revertedWith("Deposit amount must be positive");
    });

    it("Should fail with non-whitelisted token", async function () {
      const { escrow, createEscrowParams } = await loadFixture(deployEscrowFixture);

      // Deploy another token that's not whitelisted
      const MockToken = await ethers.getContractFactory("MockERC20");
      const nonWhitelistedToken = await MockToken.deploy("Bad Token", "BAD", ethers.utils.parseEther("1000"));

      const invalidTokenParams = { ...createEscrowParams, tokenAddress: nonWhitelistedToken.address };
      await expect(escrow.createEscrow(invalidTokenParams))
        .to.be.revertedWith("Token not whitelisted");
    });
  });

  describe("Fund Deposit", function () {
    it("Should allow buyer to deposit funds", async function () {
      const { escrow, createEscrowParams, buyer, depositAmount } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);

      await expect(escrow.connect(buyer).depositFunds(0))
        .to.emit(escrow, "FundsDeposited")
        .withArgs(0, buyer.address, depositAmount);

      const escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(1); // Deposited state
    });

    it("Should fail if not buyer tries to deposit", async function () {
      const { escrow, createEscrowParams, seller } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);

      await expect(escrow.connect(seller).depositFunds(0))
        .to.be.revertedWith("Only buyer can deposit");
    });

    it("Should fail if deposit deadline passed", async function () {
      const { escrow, createEscrowParams, buyer } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);

      // Fast forward past deposit deadline
      await time.increase(86401); // 24 hours + 1 second

      await expect(escrow.connect(buyer).depositFunds(0))
        .to.be.revertedWith("Deposit deadline passed");
    });

    it("Should fail if escrow not in Created state", async function () {
      const { escrow, createEscrowParams, buyer } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);
      await escrow.connect(buyer).depositFunds(0);

      // Try to deposit again
      await expect(escrow.connect(buyer).depositFunds(0))
        .to.be.revertedWith("Invalid escrow state");
    });
  });

  describe("Verification", function () {
    it("Should allow agent to complete verification", async function () {
      const { escrow, createEscrowParams, buyer, agent } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);
      await escrow.connect(buyer).depositFunds(0);

      await expect(escrow.connect(agent).completeVerification(0))
        .to.emit(escrow, "VerificationCompleted")
        .withArgs(0, agent.address);

      const escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(2); // Verified state
      expect(escrowData.property.verified).to.be.true;
    });

    it("Should allow admin to complete verification", async function () {
      const { escrow, createEscrowParams, buyer, owner } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);
      await escrow.connect(buyer).depositFunds(0);

      await expect(escrow.connect(owner).completeVerification(0))
        .to.emit(escrow, "VerificationCompleted")
        .withArgs(0, owner.address);
    });

    it("Should fail if unauthorized user tries to verify", async function () {
      const { escrow, createEscrowParams, buyer, seller } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);
      await escrow.connect(buyer).depositFunds(0);

      await expect(escrow.connect(seller).completeVerification(0))
        .to.be.revertedWith("Only agent or admin can verify");
    });

    it("Should fail if verification deadline passed", async function () {
      const { escrow, createEscrowParams, buyer, agent } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);
      await escrow.connect(buyer).depositFunds(0);

      // Fast forward past verification deadline
      await time.increase(172801); // 48 hours + 1 second

      await expect(escrow.connect(agent).completeVerification(0))
        .to.be.revertedWith("Verification deadline passed");
    });
  });

  describe("Approvals", function () {
    beforeEach(async function () {
      const { escrow, createEscrowParams, buyer, agent } = await loadFixture(deployEscrowFixture);
      this.escrow = escrow;
      this.buyer = buyer;
      this.agent = agent;

      await escrow.createEscrow(createEscrowParams);
      await escrow.connect(buyer).depositFunds(0);
      await escrow.connect(agent).completeVerification(0);
    });

    it("Should allow buyer to give approval", async function () {
      const { buyer } = this;
      
      await expect(this.escrow.connect(buyer).giveApproval(0))
        .to.emit(this.escrow, "ApprovalGiven")
        .withArgs(0, buyer.address, 0); // Role.Buyer = 0

      const escrowData = await this.escrow.getEscrow(0);
      expect(escrowData.buyerApproval).to.be.true;
    });

    it("Should allow seller to give approval", async function () {
      const { escrow, createEscrowParams } = await loadFixture(deployEscrowFixture);
      const seller = await ethers.getSigner(createEscrowParams.seller);
      
      await expect(this.escrow.connect(seller).giveApproval(0))
        .to.emit(this.escrow, "ApprovalGiven")
        .withArgs(0, seller.address, 1); // Role.Seller = 1
    });

    it("Should prevent double approval", async function () {
      const { buyer } = this;
      
      await this.escrow.connect(buyer).giveApproval(0);
      
      await expect(this.escrow.connect(buyer).giveApproval(0))
        .to.be.revertedWith("Buyer already approved");
    });
  });

  describe("Fund Release", function () {
    it("Should release funds when all conditions met", async function () {
      const { escrow, createEscrowParams, buyer, seller, agent, token, depositAmount } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);
      await escrow.connect(buyer).depositFunds(0);
      await escrow.connect(agent).completeVerification(0);

      // Give all approvals
      await escrow.connect(buyer).giveApproval(0);
      await escrow.connect(seller).giveApproval(0);
      await escrow.connect(agent).giveApproval(0);

      const sellerBalanceBefore = await token.balanceOf(seller.address);

      await expect(escrow.releaseFunds(0))
        .to.emit(escrow, "FundsReleased");

      const escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(3); // Released state

      // Check seller received funds (minus fees)
      const sellerBalanceAfter = await token.balanceOf(seller.address);
      expect(sellerBalanceAfter.gt(sellerBalanceBefore)).to.be.true;
    });

    it("Should fail if release conditions not met", async function () {
      const { escrow, createEscrowParams, buyer, agent } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);
      await escrow.connect(buyer).depositFunds(0);
      await escrow.connect(agent).completeVerification(0);

      // Only buyer approval given
      await escrow.connect(buyer).giveApproval(0);

      await expect(escrow.releaseFunds(0))
        .to.be.revertedWith("Release conditions not met");
    });
  });

  describe("Disputes", function () {
    beforeEach(async function () {
      const { escrow, createEscrowParams, buyer, agent } = await loadFixture(deployEscrowFixture);
      this.escrow = escrow;
      this.buyer = buyer;
      this.agent = agent;

      await escrow.createEscrow(createEscrowParams);
      await escrow.connect(buyer).depositFunds(0);
    });

    it("Should allow participants to raise dispute", async function () {
      const { buyer } = this;
      const reason = "Property inspection failed";

      await expect(this.escrow.connect(buyer).raiseDispute(0, reason))
        .to.emit(this.escrow, "DisputeRaised")
        .withArgs(0, buyer.address, reason);

      const escrowData = await this.escrow.getEscrow(0);
      expect(escrowData.state).to.equal(4); // Disputed state
      expect(escrowData.disputeReason).to.equal(reason);
    });

    it("Should allow arbiter to resolve dispute in favor of buyer", async function () {
      const { escrow, createEscrowParams, buyer, arbiter, token, depositAmount } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);
      await escrow.connect(buyer).depositFunds(0);
      await escrow.connect(buyer).raiseDispute(0, "Test dispute");

      const buyerBalanceBefore = await token.balanceOf(buyer.address);

      await expect(escrow.connect(arbiter).resolveDispute(0, true, "Refunding buyer"))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(0, arbiter.address, "Refunding buyer")
        .and.to.emit(escrow, "FundsRefunded")
        .withArgs(0, buyer.address, depositAmount);

      const escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(5); // Refunded state

      // Check buyer got refund
      const buyerBalanceAfter = await token.balanceOf(buyer.address);
      expect(buyerBalanceAfter.sub(buyerBalanceBefore)).to.equal(depositAmount);
    });

    it("Should fail if non-arbiter tries to resolve", async function () {
      const { buyer, other } = this;

      await this.escrow.connect(buyer).raiseDispute(0, "Test dispute");

      await expect(this.escrow.connect(other).resolveDispute(0, true, "Unauthorized resolution"))
        .to.be.revertedWith("Only arbiter or admin can resolve");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow admin to pause contract", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);

      await escrow.connect(owner).pause();
      expect(await escrow.paused()).to.be.true;

      // Should fail to create escrow when paused
      const { createEscrowParams } = await loadFixture(deployEscrowFixture);
      await expect(escrow.createEscrow(createEscrowParams))
        .to.be.revertedWith("Pausable: paused");
    });

    it("Should allow admin to unpause contract", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);

      await escrow.connect(owner).pause();
      await escrow.connect(owner).unpause();
      expect(await escrow.paused()).to.be.false;
    });

    it("Should allow admin to recover stuck tokens", async function () {
      const { escrow, owner, token } = await loadFixture(deployEscrowFixture);

      // Send some tokens directly to contract
      const amount = ethers.utils.parseEther("10");
      await token.transfer(escrow.address, amount);

      const ownerBalanceBefore = await token.balanceOf(owner.address);

      await escrow.connect(owner).emergencyTokenRecovery(token.address, amount);

      const ownerBalanceAfter = await token.balanceOf(owner.address);
      expect(ownerBalanceAfter.sub(ownerBalanceBefore)).to.equal(amount);
    });
  });

  describe("View Functions", function () {
    it("Should return correct escrow state", async function () {
      const { escrow, createEscrowParams } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);
      expect(await escrow.getEscrowState(0)).to.equal(0); // Created state
    });

    it("Should correctly check if funds can be released", async function () {
      const { escrow, createEscrowParams, buyer, seller, agent } = await loadFixture(deployEscrowFixture);

      await escrow.createEscrow(createEscrowParams);
      expect(await escrow.canReleaseFunds(0)).to.be.false;

      await escrow.connect(buyer).depositFunds(0);
      await escrow.connect(agent).completeVerification(0);
      expect(await escrow.canReleaseFunds(0)).to.be.false;

      await escrow.connect(buyer).giveApproval(0);
      await escrow.connect(seller).giveApproval(0);
      await escrow.connect(agent).giveApproval(0);
      expect(await escrow.canReleaseFunds(0)).to.be.true;
    });
  });
});

// Mock ERC20 contract for testing
contract("MockERC20", () => {
  // This would be implemented as a separate file in a real project
  // For brevity, including the interface here
});
