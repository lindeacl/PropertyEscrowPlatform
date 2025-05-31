const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PropertyEscrow - Enhanced Coverage", function () {
  let propertyEscrow, mockToken, factory;
  let owner, buyer, seller, agent, arbiter;
  let escrowId = 0;

  beforeEach(async function () {
    [owner, buyer, seller, agent, arbiter] = await ethers.getSigners();

    // Deploy MockERC20
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Test USDC", "USDC", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();

    // Deploy EscrowFactory
    const EscrowFactory = await ethers.getContractFactory("EscrowFactory");
    factory = await EscrowFactory.deploy(
      owner.address,
      250,
      agent.address,
      arbiter.address
    );
    await factory.waitForDeployment();

    // Whitelist token and create escrow
    await factory.whitelistToken(await mockToken.getAddress(), true);
    
    await factory.createEscrow({
      buyer: buyer.address,
      seller: seller.address,
      agent: agent.address,
      arbiter: arbiter.address,
      tokenAddress: await mockToken.getAddress(),
      depositAmount: ethers.parseEther("1000"),
      agentFee: 250,
      arbiterFee: 50,
      platformFee: 250,
      depositDeadline: Math.floor(Date.now() / 1000) + 86400,
      verificationDeadline: Math.floor(Date.now() / 1000) + 172800,
      property: {
        propertyId: "Test Property",
        description: "Test Description",
        salePrice: ethers.parseEther("1000"),
        documentHash: "QmTest123",
        verified: false
      }
    });

    const escrowAddress = await factory.getEscrowContract(escrowId);
    propertyEscrow = await ethers.getContractAt("PropertyEscrow", escrowAddress);

    // Transfer tokens to buyer
    await mockToken.transfer(buyer.address, ethers.parseEther("2000"));
  });

  describe("Deployment and Initialization", function () {
    it("Should initialize with correct escrow details", async function () {
      const escrow = await propertyEscrow.getEscrow(escrowId);
      expect(escrow.buyer).to.equal(buyer.address);
      expect(escrow.seller).to.equal(seller.address);
      expect(escrow.agent).to.equal(agent.address);
      expect(escrow.arbiter).to.equal(arbiter.address);
      expect(escrow.tokenContract).to.equal(await mockToken.getAddress());
      expect(escrow.amount).to.equal(ethers.parseEther("1000"));
      expect(escrow.status).to.equal(0); // PENDING
    });

    it("Should have correct role assignments", async function () {
      const ADMIN_ROLE = await propertyEscrow.ADMIN_ROLE();
      const AGENT_ROLE = await propertyEscrow.AGENT_ROLE();
      const ARBITER_ROLE = await propertyEscrow.ARBITER_ROLE();

      expect(await propertyEscrow.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await propertyEscrow.hasRole(AGENT_ROLE, agent.address)).to.be.true;
      expect(await propertyEscrow.hasRole(ARBITER_ROLE, arbiter.address)).to.be.true;
    });
  });

  describe("Deposit Functionality", function () {
    it("Should allow buyer to deposit funds", async function () {
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      await propertyEscrow.connect(buyer).depositFunds(escrowId);

      const escrow = await propertyEscrow.getEscrow(escrowId);
      expect(escrow.status).to.equal(1); // FUNDED
    });

    it("Should reject deposits from non-buyer", async function () {
      await mockToken.connect(seller).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      
      try {
        await propertyEscrow.connect(seller).depositFunds(escrowId);
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Only buyer can deposit");
      }
    });

    it("Should reject insufficient deposit amounts", async function () {
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("500"));
      
      try {
        await propertyEscrow.connect(buyer).depositFunds(escrowId);
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Insufficient allowance");
      }
    });
  });

  describe("Fund Release Process", function () {
    beforeEach(async function () {
      // Fund the escrow first
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      await propertyEscrow.connect(buyer).depositFunds(escrowId);
    });

    it("Should allow agent to approve release", async function () {
      await propertyEscrow.connect(agent).giveApproval(escrowId);
      
      const escrow = await propertyEscrow.getEscrow(escrowId);
      expect(escrow.agentApproved).to.be.true;
    });

    it("Should complete release when both parties approve", async function () {
      await propertyEscrow.connect(agent).giveApproval(escrowId);
      await propertyEscrow.connect(buyer).giveApproval(escrowId);
      
      const escrow = await propertyEscrow.getEscrow(escrowId);
      expect(escrow.status).to.equal(2); // COMPLETED
    });

    it("Should transfer correct amounts including platform fee", async function () {
      const initialSellerBalance = await mockToken.balanceOf(seller.address);
      const initialPlatformBalance = await mockToken.balanceOf(owner.address);
      
      await propertyEscrow.connect(agent).giveApproval(escrowId);
      await propertyEscrow.connect(buyer).giveApproval(escrowId);
      
      const finalSellerBalance = await mockToken.balanceOf(seller.address);
      const finalPlatformBalance = await mockToken.balanceOf(owner.address);
      
      const expectedPlatformFee = ethers.parseEther("1000") * 250n / 10000n; // 2.5%
      const expectedSellerAmount = ethers.parseEther("1000") - expectedPlatformFee;
      
      expect(finalSellerBalance - initialSellerBalance).to.equal(expectedSellerAmount);
      expect(finalPlatformBalance - initialPlatformBalance).to.equal(expectedPlatformFee);
    });
  });

  describe("Cancellation and Refunds", function () {
    it("Should allow cancellation before funding", async function () {
      await propertyEscrow.connect(buyer).cancelEscrow(escrowId);
      
      const escrow = await propertyEscrow.getEscrow(escrowId);
      expect(escrow.status).to.equal(3); // CANCELLED
    });

    it("Should refund buyer when cancelling after funding", async function () {
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      await propertyEscrow.connect(buyer).depositFunds(escrowId);
      
      const initialBalance = await mockToken.balanceOf(buyer.address);
      await propertyEscrow.connect(buyer).cancelEscrow(escrowId);
      const finalBalance = await mockToken.balanceOf(buyer.address);
      
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1000"));
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should reject operations on non-existent escrows", async function () {
      try {
        await propertyEscrow.connect(buyer).depositFunds(999);
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Invalid escrow");
      }
    });

    it("Should handle zero-amount escrows correctly", async function () {
      await factory.createEscrow(
        buyer.address,
        seller.address,
        agent.address,
        arbiter.address,
        await mockToken.getAddress(),
        0,
        Math.floor(Date.now() / 1000) + 86400,
        "Zero Amount Property"
      );

      const escrow = await propertyEscrow.getEscrow(1);
      expect(escrow.amount).to.equal(0);
    });

    it("Should prevent double spending", async function () {
      await mockToken.connect(buyer).approve(await propertyEscrow.getAddress(), ethers.parseEther("1000"));
      await propertyEscrow.connect(buyer).depositFunds(escrowId);
      
      try {
        await propertyEscrow.connect(buyer).depositFunds(escrowId);
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Already funded");
      }
    });
  });
});