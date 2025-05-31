const { expect } = require("chai");
const { ethers } = require("hardhat");
require("chai").use(require("chai-as-promised"));

describe("MockERC20 - Enhanced Coverage Tests", function () {
  let mockToken;
  let deployer, user1, user2, unauthorized;

  beforeEach(async function () {
    [deployer, user1, user2, unauthorized] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Test USDC", "TUSDC", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();
  });

  describe("Deployment and Initial State", function () {
    it("Should set correct name and symbol", async function () {
      expect(await mockToken.name()).to.equal("Test USDC");
      expect(await mockToken.symbol()).to.equal("TUSDC");
    });

    it("Should set correct decimals", async function () {
      expect(await mockToken.decimals()).to.equal(18);
    });

    it("Should mint initial supply to deployer", async function () {
      const deployerBalance = await mockToken.balanceOf(deployer.address);
      expect(deployerBalance).to.equal(ethers.parseEther("1000000"));
    });

    it("Should set correct total supply", async function () {
      const totalSupply = await mockToken.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("1000000"));
    });

    it("Should set deployer as owner", async function () {
      expect(await mockToken.owner()).to.equal(deployer.address);
    });
  });

  describe("Minting Functions", function () {
    it("Should allow owner to mint new tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await mockToken.mint(user1.address, mintAmount);
      
      const user1Balance = await mockToken.balanceOf(user1.address);
      expect(user1Balance).to.equal(mintAmount);
    });

    it("Should increase total supply when minting", async function () {
      const initialSupply = await mockToken.totalSupply();
      const mintAmount = ethers.parseEther("1000");
      
      await mockToken.mint(user1.address, mintAmount);
      
      const newSupply = await mockToken.totalSupply();
      expect(newSupply).to.equal(initialSupply + mintAmount);
    });

    it("Should reject minting from non-owner", async function () {
      await expect(
        mockToken.connect(unauthorized).mint(user1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should emit Transfer event when minting", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(mockToken.mint(user1.address, mintAmount))
        .to.emit(mockToken, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, mintAmount);
    });

    it("Should allow minting to zero address", async function () {
      // This tests the underlying ERC20 behavior
      const mintAmount = ethers.parseEther("1000");
      await expect(
        mockToken.mint(ethers.ZeroAddress, mintAmount)
      ).to.not.be.reverted;
    });
  });

  describe("Additional Token Functions", function () {
    beforeEach(async function () {
      await mockToken.transfer(user1.address, ethers.parseEther("10000"));
    });

    it("Should handle large token transfers correctly", async function () {
      const transferAmount = ethers.parseEther("5000");
      const initialBalance = await mockToken.balanceOf(user1.address);
      
      await mockToken.connect(user1).transfer(user2.address, transferAmount);
      
      const finalBalance = await mockToken.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance - transferAmount);
    });

    it("Should emit Transfer events correctly", async function () {
      const transferAmount = ethers.parseEther("1000");
      await expect(mockToken.connect(user1).transfer(user2.address, transferAmount))
        .to.emit(mockToken, "Transfer")
        .withArgs(user1.address, user2.address, transferAmount);
    });

    it("Should handle approval edge cases", async function () {
      const approveAmount = ethers.parseEther("1000");
      await mockToken.connect(user1).approve(user2.address, approveAmount);
      
      // Approve again with different amount
      await mockToken.connect(user1).approve(user2.address, ethers.parseEther("2000"));
      
      const allowance = await mockToken.allowance(user1.address, user2.address);
      expect(allowance).to.equal(ethers.parseEther("2000"));
    });
  });

  describe("Custom Decimals Functions", function () {
    it("Should allow owner to set custom decimals", async function () {
      await mockToken.setDecimals(6);
      expect(await mockToken.decimals()).to.equal(6);
    });

    it("Should reject setting decimals from non-owner", async function () {
      await expect(
        mockToken.connect(unauthorized).setDecimals(6)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow setting decimals to zero", async function () {
      await mockToken.setDecimals(0);
      expect(await mockToken.decimals()).to.equal(0);
    });

    it("Should allow setting high decimal values", async function () {
      await mockToken.setDecimals(255);
      expect(await mockToken.decimals()).to.equal(255);
    });
  });

  describe("Standard ERC20 Functions", function () {
    beforeEach(async function () {
      await mockToken.transfer(user1.address, ethers.parseEther("10000"));
    });

    it("Should handle transfers correctly", async function () {
      const transferAmount = ethers.parseEther("1000");
      await mockToken.connect(user1).transfer(user2.address, transferAmount);
      
      const user2Balance = await mockToken.balanceOf(user2.address);
      expect(user2Balance).to.equal(transferAmount);
    });

    it("Should handle approvals correctly", async function () {
      const approveAmount = ethers.parseEther("1000");
      await mockToken.connect(user1).approve(user2.address, approveAmount);
      
      const allowance = await mockToken.allowance(user1.address, user2.address);
      expect(allowance).to.equal(approveAmount);
    });

    it("Should handle transferFrom correctly", async function () {
      const transferAmount = ethers.parseEther("1000");
      await mockToken.connect(user1).approve(user2.address, transferAmount);
      await mockToken.connect(user2).transferFrom(user1.address, user2.address, transferAmount);
      
      const user2Balance = await mockToken.balanceOf(user2.address);
      expect(user2Balance).to.equal(transferAmount);
    });

    it("Should reject transfers exceeding balance", async function () {
      const userBalance = await mockToken.balanceOf(user1.address);
      await expect(
        mockToken.connect(user1).transfer(user2.address, userBalance + ethers.parseEther("1"))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should reject transferFrom exceeding allowance", async function () {
      await mockToken.connect(user1).approve(user2.address, ethers.parseEther("500"));
      await expect(
        mockToken.connect(user2).transferFrom(user1.address, user2.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
  });

  describe("Ownership Functions", function () {
    it("Should allow owner to transfer ownership", async function () {
      await mockToken.transferOwnership(user1.address);
      expect(await mockToken.owner()).to.equal(user1.address);
    });

    it("Should reject ownership transfer from non-owner", async function () {
      await expect(
        mockToken.connect(unauthorized).transferOwnership(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to renounce ownership", async function () {
      await mockToken.renounceOwnership();
      expect(await mockToken.owner()).to.equal(ethers.ZeroAddress);
    });

    it("Should reject operations after renouncing ownership", async function () {
      await mockToken.renounceOwnership();
      await expect(
        mockToken.mint(user1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amount operations", async function () {
      await expect(mockToken.mint(user1.address, 0)).to.not.be.reverted;
      await expect(mockToken.burn(deployer.address, 0)).to.not.be.reverted;
    });

    it("Should handle maximum uint256 values", async function () {
      const maxUint256 = ethers.MaxUint256;
      await expect(
        mockToken.mint(user1.address, maxUint256)
      ).to.not.be.reverted;
    });

    it("Should maintain correct balances after multiple operations", async function () {
      await mockToken.mint(user1.address, ethers.parseEther("1000"));
      await mockToken.transfer(user2.address, ethers.parseEther("500"));
      await mockToken.burn(user1.address, ethers.parseEther("200"));
      
      const user1Balance = await mockToken.balanceOf(user1.address);
      const user2Balance = await mockToken.balanceOf(user2.address);
      
      expect(user1Balance).to.equal(ethers.parseEther("800"));
      expect(user2Balance).to.equal(ethers.parseEther("500"));
    });
  });
});