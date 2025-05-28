const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Security Tests", function () {
  async function deploySecurityTestFixture() {
    const [owner, buyer, seller, agent, arbiter, platformWallet, attacker, other] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    const token = await MockToken.deploy("Test Token", "TEST", ethers.utils.parseEther("1000000"));

    // Deploy PropertyEscrow
    const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
    const platformFee = 100; // 1%
    const escrow = await PropertyEscrow.deploy(platformWallet.address, platformFee);

    // Setup roles and whitelisting
    await escrow.whitelistToken(token.address, true);
    await escrow.grantRole(await escrow.AGENT_ROLE(), agent.address);
    await escrow.grantRole(await escrow.ARBITER_ROLE(), arbiter.address);

    // Mint tokens to participants
    const depositAmount = ethers.utils.parseEther("100");
    await token.transfer(buyer.address, depositAmount.mul(3));
    await token.transfer(attacker.address, depositAmount.mul(3));

    const property = {
      propertyId: "PROP001",
      description: "Test Property",
      salePrice: depositAmount,
      documentHash: "QmTestHash",
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
      agentFee: ethers.utils.parseEther("5"),
      platformFee: platformFee,
      property: property,
      depositDeadline: now + 86400,
      verificationDeadline: now + 172800
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
      attacker,
      other,
      createEscrowParams,
      depositAmount
    };
  }

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy attacks on fund release", async function () {
      const { escrow, createEscrowParams, buyer, seller, agent } = await loadFixture(deploySecurityTestFixture);

      // Deploy malicious contract that attempts reentrancy
      const MaliciousReceiver = await ethers.getContractFactory("MaliciousReceiver");
      const maliciousContract = await MaliciousReceiver.deploy();

      // Create escrow with malicious contract as seller
      const maliciousParams = {
        ...createEscrowParams,
        seller: maliciousContract.address
      };

      await escrow.createEscrow(maliciousParams);
      
      // Fund and complete the escrow
      await token.connect(buyer).approve(escrow.address, createEscrowParams.depositAmount);
      await escrow.connect(buyer).depositFunds(0);
      await escrow.connect(agent).completeVerification(0);
      await escrow.connect(buyer).giveApproval(0);
      
      // Malicious contract gives seller approval
      await maliciousContract.giveApproval(escrow.address, 0);
      await escrow.connect(agent).giveApproval(0);

      // Set up the malicious contract to attempt reentrancy
      await maliciousContract.setTarget(escrow.address);

      // The attack should fail due to reentrancy protection
      await expect(escrow.releaseFunds(0))
        .to.not.be.reverted; // Should complete successfully without reentrancy

      // Verify the escrow state is correct (only released once)
      const escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(3); // Released state
    });

    it("Should prevent reentrancy on dispute resolution", async function () {
      const { escrow, token, createEscrowParams, buyer, arbiter } = await loadFixture(deploySecurityTestFixture);

      // Deploy malicious contract
      const MaliciousReceiver = await ethers.getContractFactory("MaliciousReceiver");
      const maliciousContract = await MaliciousReceiver.deploy();

      // Create escrow with malicious contract as buyer
      const maliciousParams = {
        ...createEscrowParams,
        buyer: maliciousContract.address
      };

      await escrow.createEscrow(maliciousParams);
      
      // Fund the malicious contract and approve
      await token.transfer(maliciousContract.address, createEscrowParams.depositAmount);
      await maliciousContract.approveToken(token.address, escrow.address, createEscrowParams.depositAmount);
      await maliciousContract.depositFunds(escrow.address, 0);

      // Raise dispute
      await maliciousContract.raiseDispute(escrow.address, 0, "Malicious dispute");

      // Set up reentrancy attempt
      await maliciousContract.setTarget(escrow.address);

      // Resolve dispute in favor of buyer (refund) - should not allow reentrancy
      await expect(escrow.connect(arbiter).resolveDispute(0, true, "Test resolution"))
        .to.not.be.reverted;

      const escrowData = await escrow.getEscrow(0);
      expect(escrowData.state).to.equal(5); // Refunded state
    });
  });

  describe("Access Control", function () {
    it("Should prevent unauthorized role assignments", async function () {
      const { escrow, attacker } = await loadFixture(deploySecurityTestFixture);

      const ADMIN_ROLE = await escrow.ADMIN_ROLE();
      const AGENT_ROLE = await escrow.AGENT_ROLE();
      const ARBITER_ROLE = await escrow.ARBITER_ROLE();

      // Attacker tries to grant themselves admin role
      await expect(escrow.connect(attacker).grantRole(ADMIN_ROLE, attacker.address))
        .to.be.revertedWith(/AccessControl: account .* is missing role/);

      // Attacker tries to grant themselves agent role
      await expect(escrow.connect(attacker).grantRole(AGENT_ROLE, attacker.address))
        .to.be.revertedWith(/AccessControl: account .* is missing role/);

      // Attacker tries to grant themselves arbiter role
      await expect(escrow.connect(attacker).grantRole(ARBITER_ROLE, attacker.address))
        .to.be.revertedWith(/AccessControl: account .* is missing role/);
    });

    it("Should prevent unauthorized function calls", async function () {
      const { escrow, createEscrowParams, buyer, attacker } = await loadFixture(deploySecurityTestFixture);

      await escrow.createEscrow(createEscrowParams);
      await token.connect(buyer).approve(escrow.address, createEscrowParams.depositAmount);
      await escrow.connect(buyer).depositFunds(0);

      // Attacker tries to complete verification
      await expect(escrow.connect(attacker).completeVerification(0))
        .to.be.revertedWith("Only agent or admin can verify");

      // Attacker tries to resolve non-existent dispute
      await expect(escrow.connect(attacker).resolveDispute(0, true, "Malicious resolution"))
        .to.be.revertedWith("Invalid escrow state");

      // Attacker tries to refund buyer
      await expect(escrow.connect(attacker).refundBuyer(0))
        .to.be.revertedWith("Only admin can refund");

      // Attacker tries to pause contract
      await expect(escrow.connect(attacker).pause())
        .to.be.revertedWith(/AccessControl: account .* is missing role/);
    });

    it("Should prevent unauthorized token whitelisting", async function () {
      const { escrow, attacker } = await loadFixture(deploySecurityTestFixture);

      // Deploy another token
      const MockToken = await ethers.getContractFactory("MockERC20");
      const newToken = await MockToken.deploy("New Token", "NEW", ethers.utils.parseEther("1000"));

      // Attacker tries to whitelist token
      await expect(escrow.connect(attacker).whitelistToken(newToken.address, true))
        .to.be.revertedWith(/AccessControl: account .* is missing role/);
    });
  });

  describe("State Manipulation Protection", function () {
    it("Should prevent state transitions in wrong order", async function () {
      const { escrow, createEscrowParams, buyer, agent } = await loadFixture(deploySecurityTestFixture);

      await escrow.createEscrow(createEscrowParams);

      // Try to verify before deposit
      await expect(escrow.connect(agent).completeVerification(0))
        .to.be.revertedWith("Invalid escrow state");

      // Try to give approval before verification
      await expect(escrow.connect(buyer).giveApproval(0))
        .to.be.revertedWith("Invalid escrow state");

      // Try to release funds before proper state
      await expect(escrow.releaseFunds(0))
        .to.be.revertedWith("Invalid escrow state");
    });

    it("Should prevent double spending", async function () {
      const { escrow, token, createEscrowParams, buyer, seller, agent } = await loadFixture(deploySecurityTestFixture);

      await escrow.createEscrow(createEscrowParams);
      await token.connect(buyer).approve(escrow.address, createEscrowParams.depositAmount);
      await escrow.connect(buyer).depositFunds(0);
      await escrow.connect(agent).completeVerification(0);
      await escrow.connect(buyer).giveApproval(0);
      await escrow.connect(seller).giveApproval(0);
      await escrow.connect(agent).giveApproval(0);

      // Release funds
      await escrow.releaseFunds(0);

      // Try to release again
      await expect(escrow.releaseFunds(0))
        .to.be.revertedWith("Invalid escrow state");

      // Try to refund after release
      await expect(escrow.connect(owner).refundBuyer(0))
        .to.be.revertedWith("Cannot refund in current state");
    });

    it("Should prevent approval after escrow completion", async function () {
      const { escrow, token, createEscrowParams, buyer, seller, agent } = await loadFixture(deploySecurityTestFixture);

      await escrow.createEscrow(createEscrowParams);
      await token.connect(buyer).approve(escrow.address, createEscrowParams.depositAmount);
      await escrow.connect(buyer).depositFunds(0);
      await escrow.connect(agent).completeVerification(0);
      await escrow.connect(buyer).giveApproval(0);
      await escrow.connect(seller).giveApproval(0);
      await escrow.connect(agent).giveApproval(0);
      await escrow.releaseFunds(0);

      // Try to give approval after release
      await expect(escrow.connect(buyer).giveApproval(0))
        .to.be.revertedWith("Invalid escrow state");
    });
  });

  describe("Token Security", function () {
    it("Should prevent deposit with non-whitelisted tokens", async function () {
      const { escrow, createEscrowParams, buyer } = await loadFixture(deploySecurityTestFixture);

      // Deploy malicious token
      const MaliciousToken = await ethers.getContractFactory("MockERC20");
      const maliciousToken = await MaliciousToken.deploy("Malicious", "MAL", ethers.utils.parseEther("1000"));

      // Create escrow with malicious token
      const maliciousParams = {
        ...createEscrowParams,
        tokenAddress: maliciousToken.address
      };

      await expect(escrow.createEscrow(maliciousParams))
        .to.be.revertedWith("Token not whitelisted");
    });

    it("Should handle token transfer failures gracefully", async function () {
      const { escrow, createEscrowParams, buyer } = await loadFixture(deploySecurityTestFixture);

      await escrow.createEscrow(createEscrowParams);

      // Try to deposit without sufficient approval
      await expect(escrow.connect(buyer).depositFunds(0))
        .to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should prevent manipulation of token balances during escrow", async function () {
      const { escrow, token, createEscrowParams, buyer, agent } = await loadFixture(deploySecurityTestFixture);

      await escrow.createEscrow(createEscrowParams);
      await token.connect(buyer).approve(escrow.address, createEscrowParams.depositAmount);
      await escrow.connect(buyer).depositFunds(0);

      // Check contract balance
      const contractBalance = await token.balanceOf(escrow.address);
      expect(contractBalance).to.equal(createEscrowParams.depositAmount);

      // Complete verification and approvals
      await escrow.connect(agent).completeVerification(0);
      await escrow.connect(buyer).giveApproval(0);
      await escrow.connect(seller).giveApproval(0);
      await escrow.connect(agent).giveApproval(0);

      // Ensure contract still holds the correct amount
      const contractBalanceBeforeRelease = await token.balanceOf(escrow.address);
      expect(contractBalanceBeforeRelease).to.equal(createEscrowParams.depositAmount);

      // Release funds
      await escrow.releaseFunds(0);

      // Contract should have transferred all funds
      const contractBalanceAfterRelease = await token.balanceOf(escrow.address);
      expect(contractBalanceAfterRelease).to.equal(0);
    });
  });

  describe("Integer Overflow/Underflow Protection", function () {
    it("Should handle large deposit amounts safely", async function () {
      const { escrow, token, buyer, seller, agent, arbiter, platformWallet } = await loadFixture(deploySecurityTestFixture);

      // Create escrow with very large amount
      const largeAmount = ethers.constants.MaxUint256.div(2);
      
      // Mint large amount to buyer
      await token.mint(buyer.address, largeAmount);

      const property = {
        propertyId: "LARGE_PROP",
        description: "Expensive Property",
        salePrice: largeAmount,
        documentHash: "QmLargeHash",
        verified: false
      };

      const now = await time.latest();
      const largeEscrowParams = {
        buyer: buyer.address,
        seller: seller.address,
        agent: agent.address,
        arbiter: arbiter.address,
        tokenAddress: token.address,
        depositAmount: largeAmount,
        agentFee: ethers.utils.parseEther("1000"),
        platformFee: 100,
        property: property,
        depositDeadline: now + 86400,
        verificationDeadline: now + 172800
      };

      await expect(escrow.createEscrow(largeEscrowParams))
        .to.not.be.reverted;
    });

    it("Should prevent fee calculations that could overflow", async function () {
      const { escrow, platformWallet } = await loadFixture(deploySecurityTestFixture);

      // Try to set maximum platform fee
      await expect(escrow.setPlatformFee(500))
        .to.not.be.reverted;

      // Try to set fee above maximum
      await expect(escrow.setPlatformFee(600))
        .to.be.revertedWith("Fee too high");
    });
  });

  describe("Time-based Attack Prevention", function () {
    it("Should prevent manipulation of deadline checks", async function () {
      const { escrow, token, createEscrowParams, buyer } = await loadFixture(deploySecurityTestFixture);

      await escrow.createEscrow(createEscrowParams);

      // Move close to deadline
      await time.increase(86300); // 23 hours 55 minutes

      // Should still be able to deposit
      await token.connect(buyer).approve(escrow.address, createEscrowParams.depositAmount);
      await expect(escrow.connect(buyer).depositFunds(0))
        .to.not.be.reverted;

      // Move past deadline
      await time.increase(400); // 6 minutes 40 seconds more

      // Create another escrow to test deadline
      const newParams = {
        ...createEscrowParams,
        property: { ...createEscrowParams.property, propertyId: "PROP002" }
      };
      await escrow.createEscrow(newParams);

      // Should not be able to deposit on new escrow after its deadline
      await time.increase(86401);
      await expect(escrow.connect(buyer).depositFunds(1))
        .to.be.revertedWith("Deposit deadline passed");
    });
  });

  describe("Emergency Security Features", function () {
    it("Should allow emergency pause by admin", async function () {
      const { escrow, owner, createEscrowParams } = await loadFixture(deploySecurityTestFixture);

      // Admin can pause
      await escrow.connect(owner).pause();

      // All functions should be paused
      await expect(escrow.createEscrow(createEscrowParams))
        .to.be.revertedWith("Pausable: paused");

      // Admin can unpause
      await escrow.connect(owner).unpause();

      // Functions should work again
      await expect(escrow.createEscrow(createEscrowParams))
        .to.not.be.reverted;
    });

    it("Should prevent non-admin from pausing", async function () {
      const { escrow, attacker } = await loadFixture(deploySecurityTestFixture);

      await expect(escrow.connect(attacker).pause())
        .to.be.revertedWith(/AccessControl: account .* is missing role/);
    });
  });
});

// Mock contracts for security testing would be implemented here
// These are simplified versions for demonstration
