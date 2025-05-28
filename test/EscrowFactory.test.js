const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowFactory", function () {
  let factory, mockToken, owner, buyer, seller, agent, arbiter;
  
  beforeEach(async function () {
    [owner, buyer, seller, agent, arbiter] = await ethers.getSigners();
    
    // Deploy MockERC20
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Test Token", "TEST", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();
    
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
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      expect(await factory.platformWallet()).to.equal(owner.address);
      expect(await factory.getPlatformFee()).to.equal(250n);
      expect(await factory.getDefaultAgent()).to.equal(agent.address);
      expect(await factory.getDefaultArbiter()).to.equal(arbiter.address);
    });
  });

  describe("Token Whitelisting", function () {
    it("Should allow owner to whitelist tokens", async function () {
      const tokenAddr = await mockToken.getAddress();
      expect(await factory.isTokenWhitelisted(tokenAddr)).to.be.true;
    });
    
    it("Should reject non-owner trying to whitelist", async function () {
      await expect(
        factory.connect(buyer).whitelistToken(await mockToken.getAddress(), true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Escrow Creation", function () {
    it("Should create escrow successfully", async function () {
      const currentTime = Math.floor(Date.now() / 1000);
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
      const receipt = await tx.wait();
      
      // Check event emission
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === "EscrowCreated";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      expect(await factory.escrowCounter()).to.equal(1n);
    });
  });
});