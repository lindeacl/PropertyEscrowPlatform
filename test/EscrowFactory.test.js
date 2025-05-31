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
      try {
        await factory.connect(buyer).whitelistToken(await mockToken.getAddress(), true);
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("caller is not the owner");
      }
    });

    it("Should remove tokens from whitelist", async function () {
      const tokenAddr = await mockToken.getAddress();
      await factory.whitelistToken(tokenAddr, false);
      expect(await factory.isTokenWhitelisted(tokenAddr)).to.be.false;
      
      // Re-whitelist for other tests
      await factory.whitelistToken(tokenAddr, true);
    });

    it("Should reject escrow creation with non-whitelisted token", async function () {
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const unauthorizedToken = await MockERC20.deploy("Unauthorized", "UNAUTH", ethers.parseEther("1000"));
      
      const currentTime = Math.floor(Date.now() / 1000);
      
      try {
        await factory.createEscrow({
          buyer: buyer.address,
          seller: seller.address,
          agent: agent.address,
          arbiter: arbiter.address,
          tokenAddress: await unauthorizedToken.getAddress(),
          depositAmount: ethers.parseEther("1000"),
          agentFee: 250,
          arbiterFee: 50,
          platformFee: 250,
          depositDeadline: currentTime + 86400,
          verificationDeadline: currentTime + 172800,
          property: {
            propertyId: "Test Property",
            description: "Test Description",
            salePrice: ethers.parseEther("1000"),
            documentHash: "QmTest123",
            verified: false
          }
        });
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("Token not whitelisted");
      }
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
      
      // Check that escrow was created
      expect(receipt.status).to.equal(1);
      
      // Check escrow counter increased
      const escrowContract = await factory.getEscrowContract(0);
      expect(escrowContract).to.not.equal(ethers.ZeroAddress);
    });
  });
});