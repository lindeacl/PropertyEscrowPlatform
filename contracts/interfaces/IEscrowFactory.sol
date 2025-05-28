// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "../libraries/EscrowStructs.sol";

/**
 * @title IEscrowFactory
 * @dev Interface for the Escrow Factory contract
 */
interface IEscrowFactory {
    /**
     * @dev Events
     */
    event EscrowContractDeployed(
        address indexed escrowContract,
        address indexed creator,
        uint256 indexed escrowId
    );

    event DefaultAgentSet(address indexed agent);
    event DefaultArbiterSet(address indexed arbiter);
    event PlatformFeeUpdated(uint256 newFee);
    event TokenWhitelisted(address indexed token, bool whitelisted);

    /**
     * @dev Functions
     */
    function createEscrow(
        EscrowStructs.CreateEscrowParams calldata params
    ) external returns (address escrowContract, uint256 escrowId);

    function setDefaultAgent(address agent) external;

    function setDefaultArbiter(address arbiter) external;

    function setPlatformFee(uint256 fee) external;

    function whitelistToken(address token, bool whitelisted) external;

    function getEscrowContract(uint256 escrowId) external view returns (address);

    function isTokenWhitelisted(address token) external view returns (bool);

    function getDefaultAgent() external view returns (address);

    function getDefaultArbiter() external view returns (address);

    function getPlatformFee() external view returns (uint256);
}
