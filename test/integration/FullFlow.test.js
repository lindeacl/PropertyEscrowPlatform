const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Full Property Sale Flow Integration", function () {
  async function deployFullSystemFixture() {
    const [owner, buyer, seller, agent, arbiter, platformWallet, other] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    const token = await MockToken.deploy("USDC", "USDC", ethers.utils.parseEther("10000000"));

    // Deploy EscrowFactory
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    const platformFee = 100; // 1%
    const factory = await EscrowFactory.deploy(
      platformWallet.address,
      platformFee,
      agent.address,
      arbiter.address
    );

    // Whitelist USDC
    await factory.whitelistToken(token.address, true);

    // Setup test amounts
    const propertyPrice = ethers.utils.parseEther("500000"); // $500k
    const depositAmount = propertyPrice.div(10); // 10% deposit = $50k
    const agentFee = ethers.utils.parseEther("2500"); // $2.5k agent fee

    // Mint tokens to buyer (more than needed for testing)
    await token.transfer(buyer.address, depositAmount.mul(2));

    const property = {
      propertyId: "REAL_PROP_123",
      description: "3 bedroom house at 123 Main St",
      salePrice: propertyPrice,
      documentHash: "QmRealPropertyDocuments123",
      verified: false
    };

    const now = await time.latest();
    const createEscrowParams = {
      buyer: buyer.address,
      seller: seller.address,
      agent: agent.address,
      arbiter: arbiter.address,
      tokenAddress: token.address,
      depositAmount: depositAmount,
      agentFee: agentFee,
      platformFee: platformFee,
      property: property,
      depositDeadline: now + 86400, // 24 hours
      verificationDeadline: now + 604800 // 7 days
    };

    return {
      factory,
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
      agentFee,
      propertyPrice,
      platformFee
    };
  }

  describe("Successful Property Sale Flow", function () {
    it("Should complete full property sale successfully", async function () {
      const {
        factory,
        token,
        buyer,
        seller,
        agent,
        platformWallet,
        createEscrowParams,
        depositAmount,
        agentFee
      } = await loadFixture(deployFullSystemFixture);

      // Step 1: Create escrow through factory
      const tx = await factory.createEscrow(createEscrowParams);
      const receipt = await tx.wait();
      
      // Get the escrow contract address
      const escrowAddress = await factory.getEscrowContract(0);
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const escrow = PropertyEscrow.attach(escrowAddress);

      // Verify escrow was created correctly
      let escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(0); // Created
      expect(escrowData.buyer).to.equal(buyer.address);
      expect(escrowData.seller).to.equal(seller.address);

      // Step 2: Buyer approves and deposits funds
      await token.connect(buyer).approve(escrow.address, depositAmount);
      
      await expect(escrow.connect(buyer).depositFunds(0))
        .to.emit(escrow, "FundsDeposited")
        .withArgs(0, buyer.address, depositAmount);

      escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(1); // Deposited

      // Step 3: Agent completes property verification
      await expect(escrow.connect(agent).completeVerification(0))
        .to.emit(escrow, "VerificationCompleted")
        .withArgs(0, agent.address);

      escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(2); // Verified
      expect(escrowData.property.verified).to.be.true;

      // Step 4: All parties give approval
      await expect(escrow.connect(buyer).giveApproval(0))
        .to.emit(escrow, "ApprovalGiven");

      await expect(escrow.connect(seller).giveApproval(0))
        .to.emit(escrow, "ApprovalGiven");

      await expect(escrow.connect(agent).giveApproval(0))
        .to.emit(escrow, "ApprovalGiven");

      // Verify all approvals are given
      escrowData = await escrow.getEscrow(0);
      expect(escrowData.buyerApproval).to.be.true;
      expect(escrowData.sellerApproval).to.be.true;
      expect(escrowData.agentApproval).to.be.true;

      // Check release conditions
      expect(await escrow.canReleaseFunds(0)).to.be.true;

      // Step 5: Release funds to all parties
      const sellerBalanceBefore = await token.balanceOf(seller.address);
      const agentBalanceBefore = await token.balanceOf(agent.address);
      const platformBalanceBefore = await token.balanceOf(platformWallet.address);

      await expect(escrow.releaseFunds(0))
        .to.emit(escrow, "FundsReleased");

      // Verify final state
      escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(3); // Released

      // Verify fund distribution
      const sellerBalanceAfter = await token.balanceOf(seller.address);
      const agentBalanceAfter = await token.balanceOf(agent.address);
      const platformBalanceAfter = await token.balanceOf(platformWallet.address);

      // Calculate expected amounts
      const platformFeeAmount = depositAmount.mul(createEscrowParams.platformFee).div(10000);
      const expectedSellerAmount = depositAmount.sub(platformFeeAmount).sub(agentFee);

      expect(sellerBalanceAfter.sub(sellerBalanceBefore)).to.equal(expectedSellerAmount);
      expect(agentBalanceAfter.sub(agentBalanceBefore)).to.equal(agentFee);
      expect(platformBalanceAfter.sub(platformBalanceBefore)).to.equal(platformFeeAmount);
    });

    it("Should handle property sale with no agent fee", async function () {
      const {
        factory,
        token,
        buyer,
        seller,
        agent,
        createEscrowParams,
        depositAmount
      } = await loadFixture(deployFullSystemFixture);

      // Create escrow with no agent fee
      const noAgentFeeParams = {
        ...createEscrowParams,
        agentFee: 0
      };

      await factory.createEscrow(noAgentFeeParams);
      const escrowAddress = await factory.getEscrowContract(0);
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const escrow = PropertyEscrow.attach(escrowAddress);

      // Complete the flow
      await token.connect(buyer).approve(escrow.address, depositAmount);
      await escrow.connect(buyer).depositFunds(0);
      await escrow.connect(agent).completeVerification(0);
      await escrow.connect(buyer).giveApproval(0);
      await escrow.connect(seller).giveApproval(0);
      await escrow.connect(agent).giveApproval(0);

      const sellerBalanceBefore = await token.balanceOf(seller.address);
      const agentBalanceBefore = await token.balanceOf(agent.address);

      await escrow.releaseFunds(0);

      const sellerBalanceAfter = await token.balanceOf(seller.address);
      const agentBalanceAfter = await token.balanceOf(agent.address);

      // Agent should receive no fee
      expect(agentBalanceAfter.sub(agentBalanceBefore)).to.equal(0);
      
      // Seller should receive more (minus only platform fee)
      const platformFeeAmount = depositAmount.mul(noAgentFeeParams.platformFee).div(10000);
      const expectedSellerAmount = depositAmount.sub(platformFeeAmount);
      expect(sellerBalanceAfter.sub(sellerBalanceBefore)).to.equal(expectedSellerAmount);
    });
  });

  describe("Dispute Resolution Flow", function () {
    it("Should handle dispute raised by buyer with refund", async function () {
      const {
        factory,
        token,
        buyer,
        agent,
        arbiter,
        createEscrowParams,
        depositAmount
      } = await loadFixture(deployFullSystemFixture);

      // Create and fund escrow
      await factory.createEscrow(createEscrowParams);
      const escrowAddress = await factory.getEscrowContract(0);
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const escrow = PropertyEscrow.attach(escrowAddress);

      await token.connect(buyer).approve(escrow.address, depositAmount);
      await escrow.connect(buyer).depositFunds(0);

      // Buyer raises dispute
      const disputeReason = "Property inspection revealed major structural issues";
      await expect(escrow.connect(buyer).raiseDispute(0, disputeReason))
        .to.emit(escrow, "DisputeRaised")
        .withArgs(0, buyer.address, disputeReason);

      let escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(4); // Disputed
      expect(escrowData.disputeReason).to.equal(disputeReason);

      // Arbiter resolves in favor of buyer (refund)
      const buyerBalanceBefore = await token.balanceOf(buyer.address);
      
      await expect(escrow.connect(arbiter).resolveDispute(0, true, "Refunding due to structural issues"))
        .to.emit(escrow, "DisputeResolved")
        .and.to.emit(escrow, "FundsRefunded")
        .withArgs(0, buyer.address, depositAmount);

      // Verify state and refund
      escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(5); // Refunded

      const buyerBalanceAfter = await token.balanceOf(buyer.address);
      expect(buyerBalanceAfter.sub(buyerBalanceBefore)).to.equal(depositAmount);
    });

    it("Should handle dispute resolved in favor of seller", async function () {
      const {
        factory,
        token,
        buyer,
        seller,
        agent,
        arbiter,
        platformWallet,
        createEscrowParams,
        depositAmount,
        agentFee
      } = await loadFixture(deployFullSystemFixture);

      // Create and fund escrow
      await factory.createEscrow(createEscrowParams);
      const escrowAddress = await factory.getEscrowContract(0);
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const escrow = PropertyEscrow.attach(escrowAddress);

      await token.connect(buyer).approve(escrow.address, depositAmount);
      await escrow.connect(buyer).depositFunds(0);
      await escrow.connect(agent).completeVerification(0);

      // Seller raises dispute claiming buyer is delaying
      await escrow.connect(seller).raiseDispute(0, "Buyer delaying without valid reason");

      // Arbiter resolves in favor of seller
      await expect(escrow.connect(arbiter).resolveDispute(0, false, "No valid reason for delay"))
        .to.emit(escrow, "DisputeResolved");

      // After dispute resolution favoring seller, funds should be releasable
      let escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(2); // Verified
      expect(escrowData.buyerApproval).to.be.true;
      expect(escrowData.sellerApproval).to.be.true;
      expect(escrowData.agentApproval).to.be.true;

      // Release funds
      const sellerBalanceBefore = await token.balanceOf(seller.address);
      await escrow.releaseFunds(0);

      escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(3); // Released

      // Verify seller received funds
      const sellerBalanceAfter = await token.balanceOf(seller.address);
      const platformFeeAmount = depositAmount.mul(createEscrowParams.platformFee).div(10000);
      const expectedSellerAmount = depositAmount.sub(platformFeeAmount).sub(agentFee);
      expect(sellerBalanceAfter.sub(sellerBalanceBefore)).to.equal(expectedSellerAmount);
    });
  });

  describe("Timeout and Deadline Scenarios", function () {
    it("Should prevent deposit after deadline", async function () {
      const {
        factory,
        token,
        buyer,
        createEscrowParams,
        depositAmount
      } = await loadFixture(deployFullSystemFixture);

      await factory.createEscrow(createEscrowParams);
      const escrowAddress = await factory.getEscrowContract(0);
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const escrow = PropertyEscrow.attach(escrowAddress);

      // Fast forward past deposit deadline
      await time.increase(86401); // 24 hours + 1 second

      await token.connect(buyer).approve(escrow.address, depositAmount);
      
      await expect(escrow.connect(buyer).depositFunds(0))
        .to.be.revertedWith("Deposit deadline passed");
    });

    it("Should prevent verification after deadline", async function () {
      const {
        factory,
        token,
        buyer,
        agent,
        createEscrowParams,
        depositAmount
      } = await loadFixture(deployFullSystemFixture);

      await factory.createEscrow(createEscrowParams);
      const escrowAddress = await factory.getEscrowContract(0);
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const escrow = PropertyEscrow.attach(escrowAddress);

      // Deposit funds
      await token.connect(buyer).approve(escrow.address, depositAmount);
      await escrow.connect(buyer).depositFunds(0);

      // Fast forward past verification deadline
      await time.increase(604801); // 7 days + 1 second

      await expect(escrow.connect(agent).completeVerification(0))
        .to.be.revertedWith("Verification deadline passed");
    });
  });

  describe("Multiple Escrows Management", function () {
    it("Should handle multiple concurrent escrows", async function () {
      const {
        factory,
        token,
        buyer,
        seller,
        agent,
        createEscrowParams,
        depositAmount
      } = await loadFixture(deployFullSystemFixture);

      // Create first escrow
      await factory.createEscrow(createEscrowParams);
      
      // Create second escrow for different property
      const secondProperty = {
        ...createEscrowParams.property,
        propertyId: "REAL_PROP_456",
        description: "2 bedroom condo at 456 Oak Ave"
      };
      const secondParams = {
        ...createEscrowParams,
        property: secondProperty
      };
      await factory.createEscrow(secondParams);

      expect(await factory.getTotalEscrowContracts()).to.equal(2);

      // Get both escrow contracts
      const escrow1Address = await factory.getEscrowContract(0);
      const escrow2Address = await factory.getEscrowContract(1);
      
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const escrow1 = PropertyEscrow.attach(escrow1Address);
      const escrow2 = PropertyEscrow.attach(escrow2Address);

      // Fund both escrows
      await token.connect(buyer).approve(escrow1.address, depositAmount);
      await token.connect(buyer).approve(escrow2.address, depositAmount);
      
      await escrow1.connect(buyer).depositFunds(0);
      await escrow2.connect(buyer).depositFunds(0);

      // Complete different flows for each
      await escrow1.connect(agent).completeVerification(0);
      
      // Raise dispute on second escrow
      await escrow2.connect(buyer).raiseDispute(0, "Different issue with second property");

      // Verify independent states
      const escrow1Data = await escrow1.getEscrow(0);
      const escrow2Data = await escrow2.getEscrow(0);

      expect(escrow1Data.state).to.equal(2); // Verified
      expect(escrow2Data.state).to.equal(4); // Disputed
    });
  });

  describe("Edge Cases and Error Conditions", function () {
    it("Should handle escrow cancellation before deposit", async function () {
      const {
        factory,
        buyer,
        createEscrowParams
      } = await loadFixture(deployFullSystemFixture);

      await factory.createEscrow(createEscrowParams);
      const escrowAddress = await factory.getEscrowContract(0);
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const escrow = PropertyEscrow.attach(escrowAddress);

      // Buyer cancels before depositing
      await expect(escrow.connect(buyer).cancelEscrow(0))
        .to.emit(escrow, "EscrowCancelled")
        .withArgs(0, buyer.address);

      const escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(6); // Cancelled
    });

    it("Should handle insufficient token balance", async function () {
      const {
        factory,
        token,
        buyer,
        createEscrowParams,
        depositAmount
      } = await loadFixture(deployFullSystemFixture);

      await factory.createEscrow(createEscrowParams);
      const escrowAddress = await factory.getEscrowContract(0);
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const escrow = PropertyEscrow.attach(escrowAddress);

      // Remove most of buyer's tokens
      const buyerBalance = await token.balanceOf(buyer.address);
      await token.connect(buyer).transfer(ethers.constants.AddressZero, buyerBalance.sub(1));

      await token.connect(buyer).approve(escrow.address, depositAmount);
      
      await expect(escrow.connect(buyer).depositFunds(0))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should handle emergency token recovery", async function () {
      const {
        factory,
        token,
        owner,
        createEscrowParams
      } = await loadFixture(deployFullSystemFixture);

      await factory.createEscrow(createEscrowParams);
      const escrowAddress = await factory.getEscrowContract(0);
      const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
      const escrow = PropertyEscrow.attach(escrowAddress);

      // Transfer ownership to factory owner for management
      await escrow.transferOwnership(owner.address);
      await escrow.connect(owner).grantRole(await escrow.ADMIN_ROLE(), owner.address);

      // Send some tokens directly to escrow contract (simulating stuck tokens)
      const stuckAmount = ethers.utils.parseEther("100");
      await token.transfer(escrow.address, stuckAmount);

      const ownerBalanceBefore = await token.balanceOf(owner.address);

      // Recover stuck tokens
      await escrow.connect(owner).emergencyTokenRecovery(token.address, stuckAmount);

      const ownerBalanceAfter = await token.balanceOf(owner.address);
      expect(ownerBalanceAfter.sub(ownerBalanceBefore)).to.equal(stuckAmount);
    });
  });
});
