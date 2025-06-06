const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ComplianceManager", function () {
  let complianceManager;
  let owner, user1, user2, complianceOfficer;

  beforeEach(async function () {
    [owner, user1, user2, complianceOfficer] = await ethers.getSigners();

    const ComplianceManager = await ethers.getContractFactory("ComplianceManager");
    complianceManager = await ComplianceManager.deploy(owner.address);
    await complianceManager.waitForDeployment();

    // Grant compliance officer role
    const COMPLIANCE_OFFICER_ROLE = await complianceManager.COMPLIANCE_OFFICER_ROLE();
    await complianceManager.grantRole(COMPLIANCE_OFFICER_ROLE, complianceOfficer.address);
  });

  describe("Deployment", function () {
    it("Should deploy with correct admin", async function () {
      const DEFAULT_ADMIN_ROLE = await complianceManager.DEFAULT_ADMIN_ROLE();
      expect(await complianceManager.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Compliance Records", function () {
    it("Should create compliance record with basic KYC", async function () {
      await complianceManager.connect(complianceOfficer).createComplianceRecord(
        user1.address,
        1, // Basic KYC
        0, // Low AML risk
        "US",
        "KYC123",
        true, // Sanctions check passed
        false // Not PEP
      );

      expect(await complianceManager.isCompliant(user1.address)).to.be.true;
    });

    it("Should reject high-risk users", async function () {
      await complianceManager.connect(complianceOfficer).createComplianceRecord(
        user2.address,
        1, // Basic KYC
        3, // Prohibited AML risk
        "US",
        "KYC456",
        true,
        false
      );

      expect(await complianceManager.isCompliant(user2.address)).to.be.false;
    });

    it("Should validate transaction compliance", async function () {
      // Setup compliant users
      await complianceManager.connect(complianceOfficer).createComplianceRecord(
        user1.address, 1, 0, "US", "KYC123", true, false
      );
      await complianceManager.connect(complianceOfficer).createComplianceRecord(
        user2.address, 1, 0, "UK", "KYC456", true, false
      );

      const [valid, reason] = await complianceManager.validateTransaction(
        user1.address,
        user2.address,
        ethers.parseEther("50")
      );

      expect(valid).to.be.true;
      expect(reason).to.equal("Transaction compliant");
    });
  });
});