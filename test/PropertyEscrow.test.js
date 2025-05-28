const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PropertyEscrow", function () {
  it("should deploy successfully", async function () {
    const [deployer] = await ethers.getSigners();
    
    const PropertyEscrow = await ethers.getContractFactory("PropertyEscrow");
    const escrow = await PropertyEscrow.deploy(
      deployer.address, // platformWallet
      250 // platformFeePercentage (2.5%)
    );
    
    await escrow.waitForDeployment();
    const escrowAddress = await escrow.getAddress();
    
    expect(escrowAddress).to.properAddress;
    expect(await escrow.platformWallet()).to.equal(deployer.address);
    expect(await escrow.platformFeePercentage()).to.equal(250);
  });
});