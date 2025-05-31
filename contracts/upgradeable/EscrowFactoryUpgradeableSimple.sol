// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "../libraries/EscrowStructs.sol";
import "../core/PropertyEscrow.sol";

/**
 * @title EscrowFactoryUpgradeableSimple
 * @dev Simplified upgradeable factory with essential features only
 */
contract EscrowFactoryUpgradeableSimple is 
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // Core storage
    address public platformWallet;
    uint256 public platformFee;
    
    mapping(address => bool) public whitelistedTokens;
    address[] public escrows;
    
    // Events
    event EscrowCreated(address indexed escrow, address indexed buyer, address indexed seller);
    event TokenWhitelisted(address indexed token, bool status);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address _platformWallet,
        uint256 _platformFee
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        
        platformWallet = _platformWallet;
        platformFee = _platformFee;
    }
    
    function setTokenWhitelist(address token, bool status) external onlyOwner {
        whitelistedTokens[token] = status;
        emit TokenWhitelisted(token, status);
    }
    
    function createEscrow(
        address buyer,
        address seller,
        address /* agent */,
        address /* arbiter */,
        address tokenAddress,
        uint256 /* depositAmount */,
        uint256 /* depositDeadline */,
        string memory /* propertyId */
    ) external returns (address) {
        require(whitelistedTokens[tokenAddress], "Token not whitelisted");
        
        PropertyEscrow escrow = new PropertyEscrow(platformWallet, platformFee);
        escrows.push(address(escrow));
        
        emit EscrowCreated(address(escrow), buyer, seller);
        return address(escrow);
    }
    
    function getEscrowCount() external view returns (uint256) {
        return escrows.length;
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Only owner can authorize upgrades
        require(newImplementation != address(0), "Invalid implementation address");
    }
}