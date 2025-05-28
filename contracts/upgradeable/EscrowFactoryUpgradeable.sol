// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "../libraries/EscrowStructs.sol";
import "../compliance/IComplianceManager.sol";
import "../PropertyEscrow.sol";

/**
 * @title EscrowFactoryUpgradeable
 * @dev Upgradeable version of EscrowFactory with compliance integration
 * Uses UUPS proxy pattern for future updates
 */
contract EscrowFactoryUpgradeable is 
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // Storage
    address public platformWallet;
    uint256 public platformFee; // in basis points (100 = 1%)
    address public defaultAgent;
    address public defaultArbiter;
    IComplianceManager public complianceManager;
    
    uint256 public escrowCounter;
    mapping(uint256 => address) public escrowContracts;
    mapping(address => bool) public whitelistedTokens;
    
    // Compliance settings
    bool public complianceEnabled;
    uint256 public complianceThreshold; // Minimum amount requiring compliance
    
    // Events
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        address escrowContract
    );
    
    event TokenWhitelisted(address indexed token, bool whitelisted);
    event PlatformFeeUpdated(uint256 newFee);
    event DefaultAgentSet(address indexed agent);
    event DefaultArbiterSet(address indexed arbiter);
    event ComplianceManagerUpdated(address indexed newManager);
    event ComplianceSettingsUpdated(bool enabled, uint256 threshold);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the upgradeable contract
     */
    function initialize(
        address _platformWallet,
        uint256 _platformFee,
        address _defaultAgent,
        address _defaultArbiter,
        address _complianceManager
    ) public initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        require(_platformWallet != address(0), "Invalid platform wallet");
        require(_defaultAgent != address(0), "Invalid default agent");
        require(_defaultArbiter != address(0), "Invalid default arbiter");
        require(_platformFee <= 1000, "Platform fee too high"); // Max 10%

        platformWallet = _platformWallet;
        platformFee = _platformFee;
        defaultAgent = _defaultAgent;
        defaultArbiter = _defaultArbiter;
        
        if (_complianceManager != address(0)) {
            complianceManager = IComplianceManager(_complianceManager);
            complianceEnabled = true;
            complianceThreshold = 1000 ether; // Default threshold
        }
    }

    /**
     * @dev Create new property escrow with compliance checks
     */
    function createEscrow(
        EscrowStructs.CreateEscrowParams calldata params
    ) external nonReentrant whenNotPaused returns (address escrowContract, uint256 escrowId) {
        // Input validation
        require(params.buyer != address(0), "Invalid buyer address");
        require(params.seller != address(0), "Invalid seller address");
        require(params.tokenAddress != address(0), "Invalid token address");
        require(params.depositAmount > 0, "Invalid deposit amount");
        require(whitelistedTokens[params.tokenAddress], "Token not whitelisted");
        require(params.depositDeadline > block.timestamp, "Invalid deposit deadline");
        require(params.verificationDeadline > params.depositDeadline, "Invalid verification deadline");

        // Compliance validation
        if (complianceEnabled && params.depositAmount >= complianceThreshold) {
            require(address(complianceManager) != address(0), "Compliance manager not set");
            
            // Validate buyer compliance
            require(complianceManager.isCompliant(params.buyer), "Buyer not compliant");
            
            // Validate seller compliance
            require(complianceManager.isCompliant(params.seller), "Seller not compliant");
            
            // Transaction-level compliance check
            (bool valid, string memory reason) = complianceManager.validateTransaction(
                params.buyer,
                params.seller,
                params.depositAmount
            );
            require(valid, reason);
        }

        // Create new escrow contract
        escrowId = escrowCounter;
        escrowContract = address(new PropertyEscrow(platformWallet, platformFee));
        
        // Initialize the escrow
        PropertyEscrow(escrowContract).createEscrow(params);
        
        // Store escrow reference
        escrowContracts[escrowId] = escrowContract;
        escrowCounter++;

        emit EscrowCreated(escrowId, params.buyer, params.seller, escrowContract);
    }

    /**
     * @dev Update compliance manager (admin only)
     */
    function setComplianceManager(
        address _complianceManager
    ) external onlyOwner {
        complianceManager = IComplianceManager(_complianceManager);
        emit ComplianceManagerUpdated(_complianceManager);
    }

    /**
     * @dev Update compliance settings
     */
    function updateComplianceSettings(
        bool _enabled,
        uint256 _threshold
    ) external onlyOwner {
        complianceEnabled = _enabled;
        complianceThreshold = _threshold;
        emit ComplianceSettingsUpdated(_enabled, _threshold);
    }

    /**
     * @dev Whitelist or remove token
     */
    function whitelistToken(address token, bool whitelisted) external onlyOwner {
        require(token != address(0), "Invalid token address");
        whitelistedTokens[token] = whitelisted;
        emit TokenWhitelisted(token, whitelisted);
    }

    /**
     * @dev Set platform fee
     */
    function setPlatformFee(uint256 fee) external onlyOwner {
        require(fee <= 1000, "Fee too high"); // Max 10%
        platformFee = fee;
        emit PlatformFeeUpdated(fee);
    }

    /**
     * @dev Set default agent
     */
    function setDefaultAgent(address agent) external onlyOwner {
        require(agent != address(0), "Invalid agent address");
        defaultAgent = agent;
        emit DefaultAgentSet(agent);
    }

    /**
     * @dev Set default arbiter
     */
    function setDefaultArbiter(address arbiter) external onlyOwner {
        require(arbiter != address(0), "Invalid arbiter address");
        defaultArbiter = arbiter;
        emit DefaultArbiterSet(arbiter);
    }

    /**
     * @dev Get escrow contract address
     */
    function getEscrowContract(uint256 escrowId) external view returns (address) {
        require(escrowId < escrowCounter, "Invalid escrow ID");
        return escrowContracts[escrowId];
    }

    /**
     * @dev Check if token is whitelisted
     */
    function isTokenWhitelisted(address token) external view returns (bool) {
        return whitelistedTokens[token];
    }

    /**
     * @dev Get default agent address
     */
    function getDefaultAgent() external view returns (address) {
        return defaultAgent;
    }

    /**
     * @dev Get default arbiter address
     */
    function getDefaultArbiter() external view returns (address) {
        return defaultArbiter;
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Resume operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Authorize upgrade (UUPS pattern)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Get implementation version for upgrade tracking
     */
    function getVersion() external pure returns (string memory) {
        return "1.0.0";
    }
}