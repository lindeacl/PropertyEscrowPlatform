// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IPaymentAdapter
 * @dev Interface for payment adapters supporting different token types and payment rails
 * @notice Enables future expansion with new payment methods without core contract changes
 */
interface IPaymentAdapter {
    /**
     * @dev Emitted when a payment is processed
     */
    event PaymentProcessed(
        address indexed from,
        address indexed to,
        uint256 amount,
        address indexed token,
        bytes metadata
    );

    /**
     * @dev Process payment from sender to receiver
     */
    function processPayment(
        address from,
        address to,
        uint256 amount,
        address token,
        bytes calldata metadata
    ) external returns (bool success);

    /**
     * @dev Validate payment parameters before processing
     */
    function validatePayment(
        address from,
        address to,
        uint256 amount,
        address token
    ) external view returns (bool isValid, string memory reason);

    /**
     * @dev Check if a token is supported by this adapter
     */
    function isTokenSupported(address token) external view returns (bool supported);

    /**
     * @dev Get adapter-specific information
     */
    function getAdapterInfo() external view returns (
        string memory name,
        string memory version,
        string[] memory supportedFeatures
    );
}