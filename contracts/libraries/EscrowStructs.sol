// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EscrowStructs
 * @dev Library containing all struct definitions for the escrow system
 */
library EscrowStructs {
    /**
     * @dev Enum representing the current state of an escrow
     */
    enum EscrowState {
        Created,        // Escrow created but no deposit yet
        Deposited,      // Funds deposited, awaiting verification
        Verified,       // Verification complete, awaiting release
        Released,       // Funds released to seller
        Disputed,       // Dispute raised, awaiting resolution
        Refunded,       // Funds refunded to buyer
        Cancelled       // Escrow cancelled
    }

    /**
     * @dev Enum representing different roles in the escrow system
     */
    enum Role {
        Buyer,
        Seller,
        Agent,
        Admin,
        Arbiter
    }

    /**
     * @dev Struct representing property information
     */
    struct Property {
        string propertyId;          // Unique property identifier
        string description;         // Property description
        uint256 salePrice;         // Total sale price in tokens
        string documentHash;       // IPFS hash of property documents
        bool verified;             // Whether property verification is complete
    }

    /**
     * @dev Struct representing the main escrow data
     */
    struct Escrow {
        uint256 id;                    // Unique escrow ID
        address buyer;                 // Buyer's address
        address seller;                // Seller's address
        address agent;                 // Escrow agent's address
        address arbiter;               // Dispute arbiter's address
        address tokenAddress;          // ERC20 token contract address
        uint256 depositAmount;         // Amount deposited by buyer
        uint256 agentFee;             // Fee for the escrow agent
        uint256 platformFee;          // Fee for the platform
        EscrowState state;            // Current state of the escrow
        Property property;            // Property information
        uint256 createdAt;            // Timestamp when escrow was created
        uint256 depositDeadline;      // Deadline for deposit
        uint256 verificationDeadline; // Deadline for verification
        bool buyerApproval;           // Buyer's approval for release
        bool sellerApproval;          // Seller's approval for release
        bool agentApproval;           // Agent's approval for release
        string disputeReason;         // Reason for dispute if any
    }

    /**
     * @dev Struct for escrow creation parameters
     */
    struct CreateEscrowParams {
        address buyer;
        address seller;
        address agent;
        address arbiter;
        address tokenAddress;
        uint256 depositAmount;
        uint256 agentFee;
        uint256 platformFee;
        Property property;
        uint256 depositDeadline;
        uint256 verificationDeadline;
    }

    /**
     * @dev Struct for dispute information
     */
    struct Dispute {
        address initiator;         // Who initiated the dispute
        string reason;            // Reason for the dispute
        uint256 timestamp;        // When dispute was raised
        bool resolved;            // Whether dispute is resolved
        address resolvedBy;       // Who resolved the dispute
        string resolution;        // Resolution details
    }
}
