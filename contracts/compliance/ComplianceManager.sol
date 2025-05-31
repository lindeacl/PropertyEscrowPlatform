// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ComplianceManager
 * @dev Enterprise compliance management system for KYC/AML validation
 * Provides hooks for regulatory compliance in property transactions
 */
contract ComplianceManager is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");
    bytes32 public constant KYC_PROVIDER_ROLE = keccak256("KYC_PROVIDER_ROLE");
    bytes32 public constant AML_PROVIDER_ROLE = keccak256("AML_PROVIDER_ROLE");

    // Compliance status enumeration
    enum ComplianceStatus {
        Pending,     // Initial state
        Approved,    // Compliance approved
        Rejected,    // Compliance rejected
        Expired,     // Compliance expired
        Suspended    // Compliance suspended
    }

    // KYC verification levels
    enum KYCLevel {
        None,        // No KYC
        Basic,       // Basic identity verification
        Enhanced,    // Enhanced due diligence
        Corporate    // Corporate KYC
    }

    // AML risk levels
    enum AMLRisk {
        Low,         // Low risk
        Medium,      // Medium risk
        High,        // High risk
        Prohibited   // Prohibited jurisdiction/entity
    }

    // Compliance record structure
    struct ComplianceRecord {
        address user;
        KYCLevel kycLevel;
        AMLRisk amlRisk;
        ComplianceStatus status;
        uint256 approvedAt;
        uint256 expiresAt;
        string jurisdiction;
        string providerRef;
        bool sanctionsCheck;
        bool pepCheck;
    }

    // Storage
    mapping(address => ComplianceRecord) public complianceRecords;
    mapping(string => bool) public approvedJurisdictions;
    mapping(string => bool) public restrictedJurisdictions;
    
    // Configuration
    uint256 public kycExpiryPeriod = 365 days;
    uint256 public amlExpiryPeriod = 90 days;
    uint256 public minimumKYCLevel = uint256(KYCLevel.Basic);
    bool public complianceRequired = true;

    // Events
    event ComplianceRecordCreated(
        address indexed user,
        KYCLevel kycLevel,
        AMLRisk amlRisk,
        string jurisdiction
    );

    event ComplianceStatusUpdated(
        address indexed user,
        ComplianceStatus oldStatus,
        ComplianceStatus newStatus
    );

    event JurisdictionUpdated(
        string indexed jurisdiction,
        bool approved
    );

    event ComplianceConfigUpdated(
        uint256 kycExpiryPeriod,
        uint256 amlExpiryPeriod,
        uint256 minimumKYCLevel
    );

    event ComplianceViolation(
        address indexed user,
        string reason,
        uint256 timestamp
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(COMPLIANCE_OFFICER_ROLE, admin);
        
        // Initialize common approved jurisdictions
        approvedJurisdictions["US"] = true;
        approvedJurisdictions["UK"] = true;
        approvedJurisdictions["EU"] = true;
        approvedJurisdictions["CA"] = true;
        approvedJurisdictions["AU"] = true;
    }

    /**
     * @dev Create or update compliance record for a user
     */
    function createComplianceRecord(
        address user,
        KYCLevel kycLevel,
        AMLRisk amlRisk,
        string calldata jurisdiction,
        string calldata providerRef,
        bool sanctionsCheck,
        bool pepCheck
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        require(user != address(0), "Invalid user address");
        require(approvedJurisdictions[jurisdiction], "Jurisdiction not approved");
        require(!restrictedJurisdictions[jurisdiction], "Jurisdiction restricted");

        ComplianceRecord storage record = complianceRecords[user];
        
        ComplianceStatus oldStatus = record.status;
        uint256 currentTime = block.timestamp;
        
        record.user = user;
        record.kycLevel = kycLevel;
        record.amlRisk = amlRisk;
        record.status = _determineComplianceStatus(kycLevel, amlRisk, sanctionsCheck, pepCheck);
        record.approvedAt = currentTime;
        record.expiresAt = currentTime + _getExpiryPeriod(kycLevel, amlRisk);
        record.jurisdiction = jurisdiction;
        record.providerRef = providerRef;
        record.sanctionsCheck = sanctionsCheck;
        record.pepCheck = pepCheck;

        emit ComplianceRecordCreated(user, kycLevel, amlRisk, jurisdiction);
        
        if (oldStatus != record.status) {
            emit ComplianceStatusUpdated(user, oldStatus, record.status);
        }
    }

    /**
     * @dev Check if user is compliant for transaction
     */
    function isCompliant(address user) external view returns (bool) {
        if (!complianceRequired) {
            return true;
        }

        ComplianceRecord memory record = complianceRecords[user];
        
        // Check if record exists
        if (record.user == address(0)) {
            return false;
        }

        // Check status
        if (record.status != ComplianceStatus.Approved) {
            return false;
        }

        // Check expiry
        if (record.expiresAt <= block.timestamp) {
            return false;
        }

        // Check minimum KYC level
        if (uint256(record.kycLevel) < minimumKYCLevel) {
            return false;
        }

        // Check AML risk level
        if (record.amlRisk == AMLRisk.Prohibited) {
            return false;
        }

        return true;
    }

    /**
     * @dev Validate transaction compliance before execution
     */
    function validateTransaction(
        address buyer,
        address seller,
        uint256 amount
    ) external view returns (bool valid, string memory reason) {
        // Check if compliance is required
        if (!complianceRequired) {
            return (true, "Compliance not required");
        }

        // Validate transaction amount limits
        if (amount == 0) {
            return (false, "Invalid transaction amount");
        }

        // Basic amount validation - using amount parameter properly
        // Additional threshold validation can be added based on compliance requirements

        // Validate buyer compliance
        if (!this.isCompliant(buyer)) {
            return (false, "Buyer not compliant");
        }

        // Validate seller compliance
        if (!this.isCompliant(seller)) {
            return (false, "Seller not compliant");
        }

        return (true, "Transaction compliant");
    }

    /**
     * @dev Update compliance status (for ongoing monitoring)
     */
    function updateComplianceStatus(
        address user,
        ComplianceStatus newStatus,
        string calldata reason
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        ComplianceRecord storage record = complianceRecords[user];
        require(record.user != address(0), "Compliance record not found");

        ComplianceStatus oldStatus = record.status;
        record.status = newStatus;

        emit ComplianceStatusUpdated(user, oldStatus, newStatus);

        if (newStatus == ComplianceStatus.Rejected || newStatus == ComplianceStatus.Suspended) {
            emit ComplianceViolation(user, reason, block.timestamp);
        }
    }

    /**
     * @dev Internal function to determine compliance status
     */
    function _determineComplianceStatus(
        KYCLevel kycLevel,
        AMLRisk amlRisk,
        bool sanctionsCheck,
        bool pepCheck
    ) internal pure returns (ComplianceStatus) {
        // Automatic rejection criteria
        if (amlRisk == AMLRisk.Prohibited || !sanctionsCheck) {
            return ComplianceStatus.Rejected;
        }

        // Enhanced scrutiny for high-risk cases
        if (amlRisk == AMLRisk.High || pepCheck) {
            return ComplianceStatus.Pending; // Requires manual review
        }

        // Standard approval criteria
        if (kycLevel >= KYCLevel.Basic && amlRisk <= AMLRisk.Medium) {
            return ComplianceStatus.Approved;
        }

        return ComplianceStatus.Pending;
    }

    /**
     * @dev Internal function to calculate expiry period
     */
    function _getExpiryPeriod(
        KYCLevel kycLevel,
        AMLRisk amlRisk
    ) internal view returns (uint256) {
        // Shorter expiry for higher risk
        if (amlRisk == AMLRisk.High) {
            return amlExpiryPeriod / 2; // 45 days for high risk
        }

        // Enhanced KYC gets longer validity
        if (kycLevel == KYCLevel.Enhanced || kycLevel == KYCLevel.Corporate) {
            return kycExpiryPeriod; // 365 days
        }

        // Standard expiry
        return (kycExpiryPeriod + amlExpiryPeriod) / 2; // ~227 days
    }
}