// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./PropertyEscrow.sol";
import "../interfaces/IEscrowFactory.sol";
import "../libraries/EscrowStructs.sol";

/**
 * @title EscrowFactory
 * @dev Factory contract for creating and managing PropertyEscrow contracts
 */
contract EscrowFactory is IEscrowFactory, Ownable, ReentrancyGuard {
    using Address for address;

    // State variables
    mapping(uint256 => address) private escrowContracts;
    mapping(address => bool) public whitelistedTokens;
    
    address private defaultAgent;
    address private defaultArbiter;
    address public immutable platformWallet;
    uint256 private platformFee;
    uint256 private escrowCounter;

    // Constants
    uint256 public constant MAX_PLATFORM_FEE = 500; // 5%

    constructor(
        address _platformWallet,
        uint256 _platformFee,
        address _defaultAgent,
        address _defaultArbiter
    ) Ownable() {
        require(_platformWallet != address(0), "Invalid platform wallet");
        require(_platformFee <= MAX_PLATFORM_FEE, "Platform fee too high");

        platformWallet = _platformWallet;
        platformFee = _platformFee;
        defaultAgent = _defaultAgent;
        defaultArbiter = _defaultArbiter;
    }

    /**
     * @dev Creates a new escrow contract and initializes it
     * @param params The escrow creation parameters
     * @return escrowContract The address of the created escrow contract
     * @return escrowId The ID of the created escrow
     */
    function createEscrow(
        EscrowStructs.CreateEscrowParams calldata params
    ) external override nonReentrant returns (address escrowContract, uint256 escrowId) {
        // Validate token is whitelisted
        require(whitelistedTokens[params.tokenAddress], "Token not whitelisted");

        // Use defaults if not provided
        EscrowStructs.CreateEscrowParams memory finalParams = params;
        if (finalParams.agent == address(0)) {
            finalParams.agent = defaultAgent;
        }
        if (finalParams.arbiter == address(0)) {
            finalParams.arbiter = defaultArbiter;
        }
        if (finalParams.platformFee == 0) {
            finalParams.platformFee = platformFee;
        }

        // Deploy new PropertyEscrow contract
        PropertyEscrow newEscrow = new PropertyEscrow(platformWallet, finalParams.platformFee);
        escrowContract = address(newEscrow);

        // Whitelist the token in the new contract
        newEscrow.whitelistToken(finalParams.tokenAddress, true);

        // Grant necessary roles
        if (finalParams.agent != address(0)) {
            newEscrow.grantRole(newEscrow.AGENT_ROLE(), finalParams.agent);
        }
        if (finalParams.arbiter != address(0)) {
            newEscrow.grantRole(newEscrow.ARBITER_ROLE(), finalParams.arbiter);
        }

        // Create the escrow in the new contract
        escrowId = newEscrow.createEscrow(finalParams);

        // Store the mapping
        escrowContracts[escrowCounter] = escrowContract;
        escrowCounter++;

        // Note: PropertyEscrow doesn't inherit Ownable, so no ownership transfer needed

        emit EscrowContractDeployed(escrowContract, msg.sender, escrowId);

        return (escrowContract, escrowId);
    }

    /**
     * @dev Sets the default agent for new escrows
     * @param agent The new default agent address
     */
    function setDefaultAgent(address agent) external override onlyOwner {
        defaultAgent = agent;
        emit DefaultAgentSet(agent);
    }

    /**
     * @dev Sets the default arbiter for new escrows
     * @param arbiter The new default arbiter address
     */
    function setDefaultArbiter(address arbiter) external override onlyOwner {
        defaultArbiter = arbiter;
        emit DefaultArbiterSet(arbiter);
    }

    /**
     * @dev Sets the platform fee for new escrows
     * @param fee The new platform fee in basis points
     */
    function setPlatformFee(uint256 fee) external override onlyOwner {
        require(fee <= MAX_PLATFORM_FEE, "Fee too high");
        platformFee = fee;
        emit PlatformFeeUpdated(fee);
    }

    /**
     * @dev Whitelists or removes a token from the whitelist
     * @param token The token address
     * @param whitelisted Whether to whitelist the token
     */
    function whitelistToken(address token, bool whitelisted) external override onlyOwner {
        require(token != address(0), "Invalid token address");
        whitelistedTokens[token] = whitelisted;
        emit TokenWhitelisted(token, whitelisted);
    }

    /**
     * @dev Gets the escrow contract address for a given escrow ID
     * @param escrowId The escrow ID from the factory
     * @return The address of the escrow contract
     */
    function getEscrowContract(uint256 escrowId) external view override returns (address) {
        require(escrowId < escrowCounter, "Invalid escrow ID");
        return escrowContracts[escrowId];
    }

    /**
     * @dev Checks if a token is whitelisted
     * @param token The token address to check
     * @return Whether the token is whitelisted
     */
    function isTokenWhitelisted(address token) external view override returns (bool) {
        return whitelistedTokens[token];
    }

    /**
     * @dev Gets the current platform fee
     * @return The platform fee in basis points
     */
    function getPlatformFee() external view override returns (uint256) {
        return platformFee;
    }

    /**
     * @dev Gets the default agent address
     * @return The default agent address
     */
    function getDefaultAgent() external view override returns (address) {
        return defaultAgent;
    }

    /**
     * @dev Gets the default arbiter address
     * @return The default arbiter address
     */
    function getDefaultArbiter() external view override returns (address) {
        return defaultArbiter;
    }

    /**
     * @dev Gets the total number of escrows created
     * @return The escrow counter
     */
    function getEscrowCount() external view override returns (uint256) {
        return escrowCounter;
    }
}
     * @dev Gets the default arbiter address
     * @return The default arbiter address
     */
    function getDefaultArbiter() external view override returns (address) {
        return defaultArbiter;
    }

    /**
     * @dev Gets the platform fee
     * @return The platform fee in basis points
     */
    function getPlatformFee() external view override returns (uint256) {
        return platformFee;
    }

    /**
     * @dev Gets the total number of escrow contracts created
     * @return The total number of escrow contracts
     */
    function getTotalEscrowContracts() external view returns (uint256) {
        return escrowCounter;
    }
}
