const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ComplianceManager - Enhanced Coverage Tests", function () {
  let complianceManager;
  let admin, user1, user2, unauthorized;

  beforeEach(async function () {
    [admin, user1, user2, unauthorized] = await ethers.getSigners();

    const ComplianceManager = await ethers.getContractFactory("ComplianceManager");
    complianceManager = await ComplianceManager.deploy(admin.address);
    await complianceManager.waitForDeployment();
  });

  describe("Access Control Edge Cases", function () {
    it("Should reject admin operations from unauthorized users", async function () {
      await expect(
        complianceManager.connect(unauthorized).updateComplianceRecord(
          user1.address,
          true,
          2,
          "Updated KYC"
        )
      ).to.be.revertedWith("AccessControl");
    });

    it("Should reject pausing from unauthorized users", async function () {
      await expect(
        complianceManager.connect(unauthorized).pause()
      ).to.be.revertedWith("AccessControl");
    });

    it("Should allow admin to grant compliance officer role", async function () {
      const COMPLIANCE_OFFICER_ROLE = await complianceManager.COMPLIANCE_OFFICER_ROLE();
      await complianceManager.grantRole(COMPLIANCE_OFFICER_ROLE, user1.address);
      
      expect(await complianceManager.hasRole(COMPLIANCE_OFFICER_ROLE, user1.address)).to.be.true;
    });

    it("Should allow compliance officer to update records", async function () {
      const COMPLIANCE_OFFICER_ROLE = await complianceManager.COMPLIANCE_OFFICER_ROLE();
      await complianceManager.grantRole(COMPLIANCE_OFFICER_ROLE, user1.address);
      
      await expect(
        complianceManager.connect(user1).updateComplianceRecord(
          user2.address,
          true,
          1,
          "KYC verified by officer"
        )
      ).to.not.be.reverted;
    });
  });

  describe("Compliance Record Edge Cases", function () {
    it("Should reject creating record with zero address", async function () {
      await expect(
        complianceManager.createComplianceRecord(
          ethers.ZeroAddress,
          true,
          1,
          "Invalid address test"
        )
      ).to.be.revertedWith("Invalid user address");
    });

    it("Should reject creating record with empty metadata", async function () {
      await expect(
        complianceManager.createComplianceRecord(
          user1.address,
          true,
          1,
          ""
        )
      ).to.be.revertedWith("Metadata cannot be empty");
    });

    it("Should reject creating duplicate records", async function () {
      await complianceManager.createComplianceRecord(
        user1.address,
        true,
        1,
        "Initial KYC"
      );

      await expect(
        complianceManager.createComplianceRecord(
          user1.address,
          true,
          1,
          "Duplicate KYC"
        )
      ).to.be.revertedWith("User already has compliance record");
    });

    it("Should emit ComplianceRecordCreated event", async function () {
      await expect(
        complianceManager.createComplianceRecord(
          user1.address,
          true,
          1,
          "KYC completed"
        )
      ).to.emit(complianceManager, "ComplianceRecordCreated")
       .withArgs(user1.address, true, 1);
    });

    it("Should emit ComplianceRecordUpdated event", async function () {
      await complianceManager.createComplianceRecord(
        user1.address,
        true,
        1,
        "Initial KYC"
      );

      await expect(
        complianceManager.updateComplianceRecord(
          user1.address,
          true,
          2,
          "Updated KYC"
        )
      ).to.emit(complianceManager, "ComplianceRecordUpdated")
       .withArgs(user1.address, true, 2);
    });

    it("Should reject updating non-existent record", async function () {
      await expect(
        complianceManager.updateComplianceRecord(
          user1.address,
          true,
          2,
          "Non-existent update"
        )
      ).to.be.revertedWith("User does not have compliance record");
    });

    it("Should reject updating record with empty metadata", async function () {
      await complianceManager.createComplianceRecord(
        user1.address,
        true,
        1,
        "Initial KYC"
      );

      await expect(
        complianceManager.updateComplianceRecord(
          user1.address,
          true,
          2,
          ""
        )
      ).to.be.revertedWith("Metadata cannot be empty");
    });
  });

  describe("Risk Assessment Edge Cases", function () {
    beforeEach(async function () {
      await complianceManager.createComplianceRecord(
        user1.address,
        true,
        1,
        "Low risk user"
      );
      await complianceManager.createComplianceRecord(
        user2.address,
        true,
        4,
        "High risk user"
      );
    });

    it("Should correctly identify high-risk users", async function () {
      const isHighRisk = await complianceManager.isHighRiskUser(user2.address);
      expect(isHighRisk).to.be.true;
    });

    it("Should correctly identify low-risk users", async function () {
      const isHighRisk = await complianceManager.isHighRiskUser(user1.address);
      expect(isHighRisk).to.be.false;
    });

    it("Should return false for users without compliance records", async function () {
      const isHighRisk = await complianceManager.isHighRiskUser(unauthorized.address);
      expect(isHighRisk).to.be.false;
    });

    it("Should reject transactions from high-risk users", async function () {
      const isValid = await complianceManager.validateTransaction(
        user2.address,
        unauthorized.address,
        ethers.parseEther("1000")
      );
      expect(isValid).to.be.false;
    });

    it("Should allow transactions from low-risk users", async function () {
      const isValid = await complianceManager.validateTransaction(
        user1.address,
        unauthorized.address,
        ethers.parseEther("1000")
      );
      expect(isValid).to.be.true;
    });

    it("Should reject transactions with zero amount", async function () {
      const isValid = await complianceManager.validateTransaction(
        user1.address,
        unauthorized.address,
        0
      );
      expect(isValid).to.be.false;
    });

    it("Should reject transactions to zero address", async function () {
      const isValid = await complianceManager.validateTransaction(
        user1.address,
        ethers.ZeroAddress,
        ethers.parseEther("1000")
      );
      expect(isValid).to.be.false;
    });

    it("Should reject transactions from zero address", async function () {
      const isValid = await complianceManager.validateTransaction(
        ethers.ZeroAddress,
        user1.address,
        ethers.parseEther("1000")
      );
      expect(isValid).to.be.false;
    });
  });

  describe("Compliance Status Functions", function () {
    it("Should return false for non-existent compliance records", async function () {
      const hasRecord = await complianceManager.hasComplianceRecord(user1.address);
      expect(hasRecord).to.be.false;
    });

    it("Should return true for existing compliance records", async function () {
      await complianceManager.createComplianceRecord(
        user1.address,
        true,
        1,
        "KYC completed"
      );

      const hasRecord = await complianceManager.hasComplianceRecord(user1.address);
      expect(hasRecord).to.be.true;
    });

    it("Should return correct KYC status", async function () {
      await complianceManager.createComplianceRecord(
        user1.address,
        true,
        1,
        "KYC completed"
      );

      const isKYCVerified = await complianceManager.isKYCVerified(user1.address);
      expect(isKYCVerified).to.be.true;
    });

    it("Should return false KYC status for unverified users", async function () {
      await complianceManager.createComplianceRecord(
        user1.address,
        false,
        1,
        "KYC pending"
      );

      const isKYCVerified = await complianceManager.isKYCVerified(user1.address);
      expect(isKYCVerified).to.be.false;
    });

    it("Should return false KYC status for users without records", async function () {
      const isKYCVerified = await complianceManager.isKYCVerified(user1.address);
      expect(isKYCVerified).to.be.false;
    });
  });

  describe("Pausing Functionality", function () {
    it("Should allow admin to pause contract", async function () {
      await complianceManager.pause();
      expect(await complianceManager.paused()).to.be.true;
    });

    it("Should prevent operations when paused", async function () {
      await complianceManager.pause();

      await expect(
        complianceManager.createComplianceRecord(
          user1.address,
          true,
          1,
          "Should fail when paused"
        )
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow admin to unpause contract", async function () {
      await complianceManager.pause();
      await complianceManager.unpause();
      expect(await complianceManager.paused()).to.be.false;
    });

    it("Should emit Paused and Unpaused events", async function () {
      await expect(complianceManager.pause())
        .to.emit(complianceManager, "Paused");

      await expect(complianceManager.unpause())
        .to.emit(complianceManager, "Unpaused");
    });
  });

  describe("Record Retrieval Functions", function () {
    beforeEach(async function () {
      await complianceManager.createComplianceRecord(
        user1.address,
        true,
        2,
        "Complete KYC record"
      );
    });

    it("Should return correct compliance record details", async function () {
      const record = await complianceManager.getComplianceRecord(user1.address);
      
      expect(record.kycVerified).to.be.true;
      expect(record.riskLevel).to.equal(2);
      expect(record.metadata).to.equal("Complete KYC record");
      expect(record.lastUpdated).to.be.gt(0);
    });

    it("Should revert when getting non-existent record", async function () {
      await expect(
        complianceManager.getComplianceRecord(user2.address)
      ).to.be.revertedWith("User does not have compliance record");
    });

    it("Should return correct timestamp for record creation", async function () {
      const record = await complianceManager.getComplianceRecord(user1.address);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Allow 60 seconds tolerance for block timestamp
      expect(Number(record.lastUpdated)).to.be.closeTo(currentTime, 60);
    });

    it("Should update timestamp when record is modified", async function () {
      const recordBefore = await complianceManager.getComplianceRecord(user1.address);
      
      // Wait a moment and update
      await new Promise(resolve => setTimeout(resolve, 1000));
      await complianceManager.updateComplianceRecord(
        user1.address,
        true,
        3,
        "Updated record"
      );
      
      const recordAfter = await complianceManager.getComplianceRecord(user1.address);
      expect(recordAfter.lastUpdated).to.be.gte(recordBefore.lastUpdated);
    });
  });

  describe("Edge Case Scenarios", function () {
    it("Should handle multiple rapid record updates correctly", async function () {
      await complianceManager.createComplianceRecord(
        user1.address,
        true,
        1,
        "Initial"
      );

      // Rapid updates
      await complianceManager.updateComplianceRecord(user1.address, true, 2, "Update 1");
      await complianceManager.updateComplianceRecord(user1.address, true, 3, "Update 2");
      await complianceManager.updateComplianceRecord(user1.address, false, 4, "Update 3");

      const finalRecord = await complianceManager.getComplianceRecord(user1.address);
      expect(finalRecord.riskLevel).to.equal(4);
      expect(finalRecord.kycVerified).to.be.false;
      expect(finalRecord.metadata).to.equal("Update 3");
    });

    it("Should handle maximum risk level correctly", async function () {
      await complianceManager.createComplianceRecord(
        user1.address,
        true,
        5, // Maximum risk level
        "Maximum risk user"
      );

      const isHighRisk = await complianceManager.isHighRiskUser(user1.address);
      expect(isHighRisk).to.be.true;
    });

    it("Should handle minimum risk level correctly", async function () {
      await complianceManager.createComplianceRecord(
        user1.address,
        true,
        1, // Minimum risk level
        "Minimum risk user"
      );

      const isHighRisk = await complianceManager.isHighRiskUser(user1.address);
      expect(isHighRisk).to.be.false;
    });
  });
});