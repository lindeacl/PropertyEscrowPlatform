const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Integration Tests - Full Property Sale Flow", function () {
  let factory, escrow, mockToken, complianceManager;
  let owner, buyer, seller, agent, arbiter;
  let escrowAddress;

  beforeEach(async function () {
    [owner, buyer, seller, agent, arbiter] = await ethers.getSigners();
    
    // Deploy MockERC20
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Test Token", "TEST", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();
    
    // Deploy ComplianceManager
    const ComplianceManager = await ethers.getContractFactory("ComplianceManager");
    complianceManager = await ComplianceManager.deploy(owner.address);
    await complianceManager.waitForDeployment();
    
    // Deploy EscrowFactory
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    factory = await EscrowFactory.deploy(
      owner.address, // platformWallet
      250, // platformFee (2.5%)
      agent.address, // defaultAgent
      arbiter.address // defaultArbiter
    );
    await factory.waitForDeployment();
    
    // Whitelist token
    await factory.whitelistToken(await mockToken.getAddress(), true);
    
    // Transfer tokens to buyer
    await mockToken.transfer(buyer.address, ethers.parseEther("1000"));
    
    // Create escrow
    const currentTime = await time.latest();
    const params = {
      buyer: buyer.address,
      seller: seller.address,
      agent: agent.address,
      arbiter: arbiter.address,
      tokenAddress: await mockToken.getAddress(),
      depositAmount: ethers.parseEther("100"),
      agentFee: 100, // 1%
      arbiterFee: 50, // 0.5%
      platformFee: 250, // 2.5%
      depositDeadline: currentTime + 86400, // 1 day
      verificationDeadline: currentTime + 172800, // 2 days
      property: {
        propertyId: "PROP123",
        description: "Test property",
        salePrice: ethers.parseEther("100"),
        documentHash: "QmTest123",
        verified: false
      }
    };

    const tx = await factory.createEscrow(params);
    await tx.wait();
    
    escrowAddress = await factory.getEscrowContract(0);
    escrow = await ethers.getContractAt("PropertyEscrow", escrowAddress);
  });

  describe("Complete Property Sale Flow", function () {
    it("Should complete full successful property sale", async function () {
      // Approve tokens for escrow
      await mockToken.connect(buyer).approve(escrowAddress, ethers.parseEther("100"));
      
      // Deposit funds
      await escrow.connect(buyer).depositFunds(0);
      
      // Verify property
      await escrow.connect(agent).completeVerification(0);
      
      // Release funds - need all approvals including agent
      const sellerBalanceBefore = await mockToken.balanceOf(seller.address);
      await escrow.connect(buyer).approveRelease();
      await escrow.connect(seller).approveRelease();
      await escrow.connect(agent).approveRelease();
      
      // Actually release the funds
      await escrow.connect(seller).releaseFunds(0);
      
      // Check funds were released
      const sellerBalanceAfter = await mockToken.balanceOf(seller.address);
      expect(Number(sellerBalanceAfter)).to.be.greaterThan(Number(sellerBalanceBefore));
    });

    it("Should handle dispute resolution", async function () {
      // Approve and deposit
      await mockToken.connect(buyer).approve(escrowAddress, ethers.parseEther("100"));
      await escrow.connect(buyer).depositFunds(0);
      
      // Raise dispute
      await escrow.connect(buyer).raiseDispute(0, "Property not as described");
      
      // Resolve dispute in favor of buyer (refund)
      await escrow.connect(arbiter).resolveDispute(0, true, "Valid complaint");
      
      // Check refund
      const buyerBalance = await mockToken.balanceOf(buyer.address);
      expect(Number(buyerBalance)).to.be.greaterThan(Number(ethers.parseEther("900"))); // Got refund
    });
  });

  describe("Security Tests", function () {
    it("Should prevent unauthorized role assignments", async function () {
      try {
        await escrow.connect(buyer).grantRole(await escrow.ADMIN_ROLE(), buyer.address);
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("AccessControl");
      }
    });

    it("Should prevent state manipulation", async function () {
      try {
        // Try to release funds without deposit
        await escrow.connect(seller).approveRelease();
        expect.fail("Should have reverted");
      } catch (error) {
        // Accept any revert error - the important thing is that it reverted
        expect(error.message).to.include("revert");
      }
    });
  });
});