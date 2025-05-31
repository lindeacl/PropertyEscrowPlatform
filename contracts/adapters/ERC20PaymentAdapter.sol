// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IPaymentAdapter.sol";

/**
 * @title ERC20PaymentAdapter
 * @dev Standard ERC20 token payment adapter for the escrow system
 */
contract ERC20PaymentAdapter is IPaymentAdapter, Ownable {
    using SafeERC20 for IERC20;

    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public minimumAmounts;

    constructor() {}

    function processPayment(
        address from,
        address to,
        uint256 amount,
        address token,
        bytes calldata metadata
    ) external override returns (bool success) {
        (bool isValid, string memory reason) = _validatePayment(from, to, amount, token);
        require(isValid, reason);

        IERC20(token).safeTransferFrom(from, to, amount);
        
        emit PaymentProcessed(from, to, amount, token, metadata);
        return true;
    }

    function validatePayment(
        address from,
        address to,
        uint256 amount,
        address token
    ) external view override returns (bool isValid, string memory reason) {
        return _validatePayment(from, to, amount, token);
    }

    function _validatePayment(
        address from,
        address to,
        uint256 amount,
        address token
    ) internal view returns (bool isValid, string memory reason) {
        if (!supportedTokens[token]) {
            return (false, "Token not supported");
        }
        
        if (from == address(0) || to == address(0)) {
            return (false, "Invalid addresses");
        }
        
        if (amount == 0) {
            return (false, "Amount must be greater than zero");
        }
        
        if (amount < minimumAmounts[token]) {
            return (false, "Amount below minimum");
        }
        
        if (IERC20(token).balanceOf(from) < amount) {
            return (false, "Insufficient balance");
        }
        
        return (true, "");
    }

    function isTokenSupported(address token) external view override returns (bool supported) {
        return supportedTokens[token];
    }

    function getAdapterInfo() external pure override returns (
        string memory name,
        string memory version,
        string[] memory supportedFeatures
    ) {
        string[] memory features = new string[](3);
        features[0] = "ERC20_TRANSFERS";
        features[1] = "BALANCE_VALIDATION";
        features[2] = "MINIMUM_AMOUNTS";
        
        return ("ERC20PaymentAdapter", "1.0.0", features);
    }

    function addSupportedToken(address token, uint256 minimumAmount) external onlyOwner {
        supportedTokens[token] = true;
        minimumAmounts[token] = minimumAmount;
    }

    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        delete minimumAmounts[token];
    }
}