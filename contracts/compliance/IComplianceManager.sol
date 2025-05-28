// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IComplianceManager
 * @dev Interface for compliance management system
 */
interface IComplianceManager {
    enum ComplianceStatus {
        Pending,
        Approved,
        Rejected,
        Expired,
        Suspended
    }

    enum KYCLevel {
        None,
        Basic,
        Enhanced,
        Corporate
    }

    enum AMLRisk {
        Low,
        Medium,
        High,
        Prohibited
    }

    /**
     * @dev Check if user is compliant for transactions
     */
    function isCompliant(address user) external view returns (bool);

    /**
     * @dev Validate transaction compliance before execution
     */
    function validateTransaction(
        address buyer,
        address seller,
        uint256 amount
    ) external view returns (bool valid, string memory reason);

    /**
     * @dev Get comprehensive compliance status
     */
    function getComplianceStatus(address user) 
        external 
        view 
        returns (
            bool compliant,
            ComplianceStatus status,
            KYCLevel kycLevel,
            AMLRisk amlRisk,
            uint256 expiresAt,
            string memory jurisdiction
        );
}