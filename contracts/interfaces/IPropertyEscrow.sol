// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../libraries/EscrowStructs.sol";

/**
 * @title IPropertyEscrow
 * @dev Interface for the Property Escrow contract
 */
interface IPropertyEscrow {
    /**
     * @dev Events
     */
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 depositAmount
    );

    event FundsDeposited(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );

    event VerificationCompleted(
        uint256 indexed escrowId,
        address indexed verifier
    );

    event ApprovalGiven(
        uint256 indexed escrowId,
        address indexed approver,
        EscrowStructs.Role role
    );

    event FundsReleased(
        uint256 indexed escrowId,
        address indexed seller,
        uint256 amount
    );

    event DisputeRaised(
        uint256 indexed escrowId,
        address indexed initiator,
        string reason
    );

    event DisputeResolved(
        uint256 indexed escrowId,
        address indexed resolver,
        string resolution
    );

    event FundsRefunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );

    event EscrowCancelled(
        uint256 indexed escrowId,
        address indexed canceller
    );

    /**
     * @dev Core functions
     */
    function createEscrow(
        EscrowStructs.CreateEscrowParams calldata params
    ) external returns (uint256);

    function depositFunds(uint256 escrowId) external;

    function completeVerification(uint256 escrowId) external;

    function giveApproval(uint256 escrowId) external;

    function releaseFunds(uint256 escrowId) external;

    function raiseDispute(uint256 escrowId, string calldata reason) external;

    function resolveDispute(
        uint256 escrowId,
        bool favorBuyer,
        string calldata resolution
    ) external;

    function refundBuyer(uint256 escrowId) external;

    function cancelEscrow(uint256 escrowId) external;

    /**
     * @dev View functions
     */
    function getEscrow(uint256 escrowId) external view returns (EscrowStructs.Escrow memory);

    function getEscrowState(uint256 escrowId) external view returns (EscrowStructs.EscrowState);

    function canReleaseFunds(uint256 escrowId) external view returns (bool);

    function getTotalEscrows() external view returns (uint256);
}
