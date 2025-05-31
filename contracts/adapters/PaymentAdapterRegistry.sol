// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IPaymentAdapter.sol";

/**
 * @title PaymentAdapterRegistry
 * @dev Registry for managing multiple payment adapters
 * @notice Enables dynamic addition of new payment methods
 */
contract PaymentAdapterRegistry is Ownable {
    mapping(string => address) public adapters;
    mapping(address => bool) public authorizedAdapters;
    string[] public adapterNames;

    event AdapterRegistered(string indexed name, address indexed adapter);
    event AdapterRemoved(string indexed name, address indexed adapter);
    event AdapterAuthorized(address indexed adapter, bool authorized);

    /**
     * @dev Register a new payment adapter
     */
    function registerAdapter(string memory name, address adapter) external onlyOwner {
        require(adapter != address(0), "Invalid adapter address");
        require(adapters[name] == address(0), "Adapter already registered");

        adapters[name] = adapter;
        authorizedAdapters[adapter] = true;
        adapterNames.push(name);

        emit AdapterRegistered(name, adapter);
        emit AdapterAuthorized(adapter, true);
    }

    /**
     * @dev Remove a payment adapter
     */
    function removeAdapter(string memory name) external onlyOwner {
        address adapter = adapters[name];
        require(adapter != address(0), "Adapter not found");

        delete adapters[name];
        authorizedAdapters[adapter] = false;

        // Remove from names array
        for (uint i = 0; i < adapterNames.length; i++) {
            if (keccak256(bytes(adapterNames[i])) == keccak256(bytes(name))) {
                adapterNames[i] = adapterNames[adapterNames.length - 1];
                adapterNames.pop();
                break;
            }
        }

        emit AdapterRemoved(name, adapter);
        emit AdapterAuthorized(adapter, false);
    }

    /**
     * @dev Get adapter by name
     */
    function getAdapter(string memory name) external view returns (address) {
        return adapters[name];
    }

    /**
     * @dev Check if adapter is authorized
     */
    function isAuthorized(address adapter) external view returns (bool) {
        return authorizedAdapters[adapter];
    }

    /**
     * @dev Get all registered adapter names
     */
    function getAllAdapterNames() external view returns (string[] memory) {
        return adapterNames;
    }

    /**
     * @dev Get adapter count
     */
    function getAdapterCount() external view returns (uint256) {
        return adapterNames.length;
    }
}