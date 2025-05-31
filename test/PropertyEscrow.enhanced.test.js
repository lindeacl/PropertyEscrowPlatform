const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PropertyEscrow - Enhanced Coverage Tests", function () {
  let propertyEscrow, mockToken, escrowFactory;
  let deployer, buyer, seller, agent, arbiter, unauthorized;
  let escrowId = 0;

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

    // Whitelist token
    await escrowFactory.whitelistToken(await mockToken.getAddress());

    // Create escrow
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
    propertyEscrow = await ethers.getContractAt("PropertyEscrow", escrowAddress);

    // Transfer tokens to buyer
    await mockToken.transfer(buyer.address, ethers.parseEther("1000"));
  });

  describe("Access Control Edge Cases", function () {
    it("Should reject unauthorized admin role assignment", async function () {
      const ADMIN_ROLE = await propertyEscrow.ADMIN_ROLE();
      await expect(
        propertyEscrow.connect(unauthorized).grantRole(ADMIN_ROLE, unauthorized.address)
      ).to.be.revertedWith("AccessControl");
    });

    it("Should reject unauthorized pause attempts", async function () {
      await expect(
        propertyEscrow.connect(unauthorized).pause()
      ).to.be.revertedWith("AccessControl");
    });

    it("Should reject unauthorized unpause attempts", async function () {
      await propertyEscrow.pause();
      await expect(
        propertyEscrow.connect(unauthorized).unpause()
      ).to.be.revertedWith("AccessControl");
    });

    it("Should prevent operations when paused", async function () {
      await propertyEscrow.pause();
      
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      await expect(
        propertyEscrow.connect(buyer).depositFunds(escrowId)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Deposit Edge Cases", function () {
    it("Should reject deposits from unauthorized addresses", async function () {
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      await expect(
        propertyEscrow.connect(unauthorized).depositFunds(escrowId)
      ).to.be.revertedWith("Only buyer can deposit");
    });

    it("Should reject deposits with insufficient allowance", async function () {
      await expect(
        propertyEscrow.connect(buyer).depositFunds(escrowId)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should reject double deposits", async function () {
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("2000"));
      await propertyEscrow.connect(buyer).depositFunds(escrowId);
      
      await expect(
        propertyEscrow.connect(buyer).depositFunds(escrowId)
      ).to.be.revertedWith("Invalid escrow state");
    });

    it("Should reject deposits for non-existent escrows", async function () {
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      await expect(
        propertyEscrow.connect(buyer).depositFunds(999)
      ).to.be.revertedWith("Invalid escrow ID");
    });
  });

  describe("Verification Edge Cases", function () {
    beforeEach(async function () {
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      await propertyEscrow.connect(buyer).depositFunds(escrowId);
    });

    it("Should reject verification from unauthorized addresses", async function () {
      await expect(
        propertyEscrow.connect(unauthorized).completeVerification(escrowId)
      ).to.be.revertedWith("Only agent can verify");
    });

    it("Should reject verification in wrong state", async function () {
      // Already verified scenario would need state manipulation
      await propertyEscrow.connect(agent).completeVerification(escrowId);
      await expect(
        propertyEscrow.connect(agent).completeVerification(escrowId)
      ).to.be.revertedWith("Invalid escrow state");
    });
  });

  describe("Approval Edge Cases", function () {
    beforeEach(async function () {
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      await propertyEscrow.connect(buyer).depositFunds(escrowId);
      await propertyEscrow.connect(agent).completeVerification(escrowId);
    });

    it("Should reject double approvals from same party", async function () {
      await propertyEscrow.connect(buyer).giveApproval(escrowId);
      await expect(
        propertyEscrow.connect(buyer).giveApproval(escrowId)
      ).to.be.revertedWith("Buyer already approved");
    });

    it("Should reject approval from unauthorized addresses", async function () {
      await expect(
        propertyEscrow.connect(unauthorized).giveApproval(escrowId)
      ).to.be.revertedWith("Not authorized to approve");
    });

    it("Should reject approval in wrong state", async function () {
      // Need to get to a state where approval is not allowed
      await propertyEscrow.connect(buyer).raiseDispute(escrowId, "Test dispute");
      await expect(
        propertyEscrow.connect(buyer).giveApproval(escrowId)
      ).to.be.revertedWith("Invalid escrow state");
    });
  });

  describe("Dispute Resolution Edge Cases", function () {
    beforeEach(async function () {
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      await propertyEscrow.connect(buyer).depositFunds(escrowId);
      await propertyEscrow.connect(agent).completeVerification(escrowId);
    });

    it("Should reject disputes from unauthorized addresses", async function () {
      await expect(
        propertyEscrow.connect(unauthorized).raiseDispute(escrowId, "Unauthorized dispute")
      ).to.be.revertedWith("Not authorized to raise dispute");
    });

    it("Should reject disputes with empty reason", async function () {
      await expect(
        propertyEscrow.connect(buyer).raiseDispute(escrowId, "")
      ).to.be.revertedWith("Dispute reason required");
    });

    it("Should reject resolution from unauthorized addresses", async function () {
      await propertyEscrow.connect(buyer).raiseDispute(escrowId, "Test dispute");
      await expect(
        propertyEscrow.connect(unauthorized).resolveDispute(escrowId, true, "Resolution")
      ).to.be.revertedWith("Only arbiter can resolve disputes");
    });

    it("Should reject resolution with empty resolution text", async function () {
      await propertyEscrow.connect(buyer).raiseDispute(escrowId, "Test dispute");
      await expect(
        propertyEscrow.connect(arbiter).resolveDispute(escrowId, true, "")
      ).to.be.revertedWith("Resolution text required");
    });
  });

  describe("Fund Release Edge Cases", function () {
    beforeEach(async function () {
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      await propertyEscrow.connect(buyer).depositFunds(escrowId);
      await propertyEscrow.connect(agent).completeVerification(escrowId);
    });

    it("Should reject fund release without sufficient approvals", async function () {
      await propertyEscrow.connect(buyer).giveApproval(escrowId);
      // Missing seller and agent approvals
      await expect(
        propertyEscrow.connect(seller).releaseFunds(escrowId)
      ).to.be.revertedWith("Release conditions not met");
    });

    it("Should reject fund release from unauthorized addresses", async function () {
      await propertyEscrow.connect(buyer).giveApproval(escrowId);
      await propertyEscrow.connect(seller).giveApproval(escrowId);
      await propertyEscrow.connect(agent).giveApproval(escrowId);
      
      await expect(
        propertyEscrow.connect(unauthorized).releaseFunds(escrowId)
      ).to.be.revertedWith("Only seller can release funds");
    });

    it("Should reject double fund releases", async function () {
      await propertyEscrow.connect(buyer).giveApproval(escrowId);
      await propertyEscrow.connect(seller).giveApproval(escrowId);
      await propertyEscrow.connect(agent).giveApproval(escrowId);
      
      await propertyEscrow.connect(seller).releaseFunds(escrowId);
      
      await expect(
        propertyEscrow.connect(seller).releaseFunds(escrowId)
      ).to.be.revertedWith("Invalid escrow state");
    });
  });

  describe("Refund Edge Cases", function () {
    beforeEach(async function () {
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      await propertyEscrow.connect(buyer).depositFunds(escrowId);
    });

    it("Should reject refund from unauthorized addresses", async function () {
      await expect(
        propertyEscrow.connect(unauthorized).refundBuyer(escrowId)
      ).to.be.revertedWith("Only admin can refund");
    });

    it("Should reject refund in invalid state", async function () {
      await propertyEscrow.connect(agent).completeVerification(escrowId);
      await propertyEscrow.connect(buyer).giveApproval(escrowId);
      await propertyEscrow.connect(seller).giveApproval(escrowId);
      await propertyEscrow.connect(agent).giveApproval(escrowId);
      await propertyEscrow.connect(seller).releaseFunds(escrowId);
      
      await expect(
        propertyEscrow.refundBuyer(escrowId)
      ).to.be.revertedWith("Cannot refund in current state");
    });
  });

  describe("View Function Edge Cases", function () {
    it("Should return correct details for valid escrow", async function () {
      const details = await propertyEscrow.getEscrowDetails(escrowId);
      expect(details.propertyId).to.equal("PROP-001");
      expect(details.buyer).to.equal(buyer.address);
      expect(details.seller).to.equal(seller.address);
    });

    it("Should revert for invalid escrow ID", async function () {
      await expect(
        propertyEscrow.getEscrowDetails(999)
      ).to.be.revertedWith("Invalid escrow ID");
    });

    it("Should return false for release conditions when not met", async function () {
      const canRelease = await propertyEscrow.canReleaseFunds(escrowId);
      expect(canRelease).to.be.false;
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow admin to pause contract", async function () {
      await propertyEscrow.pause();
      expect(await propertyEscrow.paused()).to.be.true;
    });

    it("Should allow admin to unpause contract", async function () {
      await propertyEscrow.pause();
      await propertyEscrow.unpause();
      expect(await propertyEscrow.paused()).to.be.false;
    });

    it("Should emit events on pause/unpause", async function () {
      await expect(propertyEscrow.pause())
        .to.emit(propertyEscrow, "Paused");
      
      await expect(propertyEscrow.unpause())
        .to.emit(propertyEscrow, "Unpaused");
    });
  });
});