// SPDX-License-Identifier: AGPLv3
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {GDAv1Forwarder, PoolConfig} from "./interfaces/GDAv1Forwarder.sol";
import {ISuperfluidPool} from "./interfaces/ISuperfluidPool.sol";
import {Allocation} from "./Council.sol";

// Abstract contract for managing a pool of grantees and their allocations
abstract contract PoolManager {
    // Custom error for when pool creation fails
    error PoolCreationFailed();

    // Mapping to keep track of valid grantees
    // @dev grantees[grantee] = true if the grantee is a valid grantee, false otherwise
    mapping(address => bool) private grantees;

    // Mapping to store allocations for each member
    // @dev _allocations[member] = { accounts: [grantee1, grantee2, ...], amounts: [amount1, amount2, ...] }
    mapping(address => Allocation) private _allocations;

    // Instance of the Superfluid Pool
    ISuperfluidPool public immutable pool;

    // Constructor to initialize the contract and create a new pool
    // @param _distributionToken The supertoken to be distributed
    // @param _gdav1Forwarder The address of the GDAv1Forwarder contract
    constructor(address _distributionToken, address _gdav1Forwarder) {
        // Create a new pool using the GDAv1Forwarder
        (bool _success, address _pool) = GDAv1Forwarder(_gdav1Forwarder)
            .createPool(
                _distributionToken,
                address(this),
                PoolConfig({
                    transferabilityForUnitsOwner: false,
                    distributionFromAnyAddress: true
                })
            );
        // Revert if pool creation fails
        if (!_success) revert PoolCreationFailed();
        // Initialize the pool instance
        pool = ISuperfluidPool(_pool);
    }

    // @dev function to add a new grantee
    // @param _grantee The address of the grantee to be added
    function _addGrantee(address _grantee) internal {
        grantees[_grantee] = true;
    }

    // @dev function to remove a grantee
    // @param _grantee The address of the grantee to be removed
    function _removeGrantee(address _grantee) internal {
        grantees[_grantee] = false;
        // Delete grantee's units in the pool
        pool.updateMemberUnits(_grantee, 0);
    }

    // @dev function to get the allocation for a member
    // excluding grantees that are not valid
    // @param _member The address of the member
    // @return allocation The allocation for the member
    // @return sum The total sum of allocations
    function _getAllocation(
        address _member
    ) internal view returns (Allocation memory, uint256) {
        Allocation memory allocation = _allocations[_member];
        // Count valid grantees
        uint256 granteeCount = 0;
        for (uint256 i = 0; i < allocation.accounts.length; i++) {
            if (isGrantee(allocation.accounts[i])) {
                granteeCount++;
            }
        }

        // Create arrays of the correct size
        address[] memory granteesCopy = new address[](granteeCount);
        uint128[] memory amountsCopy = new uint128[](granteeCount);

        // Fill the arrays with valid grantees and amounts
        uint256 index = 0;
        uint256 sum = 0;
        for (uint256 i = 0; i < allocation.accounts.length; i++) {
            if (isGrantee(allocation.accounts[i])) {
                granteesCopy[index] = allocation.accounts[i];
                amountsCopy[index] = allocation.amounts[i];
                index++;
                sum += allocation.amounts[i];
            }
        }
        return (Allocation(granteesCopy, amountsCopy), sum);
    }

    // @dev function to set the allocation for a member
    // @param _member The address of the member
    // @param _newAllocation The new allocation to be set
    function _setAllocation(
        address _member,
        Allocation memory _newAllocation
    ) internal {
        Allocation memory _allocation = _allocations[_member];
        // Remove old allocations from the pool
        for (uint256 i = 0; i < _allocation.accounts.length; i++) {
            pool.updateMemberUnits(
                _allocation.accounts[i],
                pool.getUnits(_allocation.accounts[i]) - _allocation.amounts[i]
            );
        }
        // Set the new allocation
        _allocations[_member] = _newAllocation;
        _allocation = _newAllocation;
        // Add new allocations to the pool
        for (uint256 i = 0; i < _allocation.accounts.length; i++) {
            pool.updateMemberUnits(
                _allocation.accounts[i],
                pool.getUnits(_allocation.accounts[i]) + _allocation.amounts[i]
            );
        }
    }

    // @notice Total allocated units
    // @return The sum of total units allocated to grantees
    function totalAllocated() external view returns (uint128) {
        return pool.getTotalUnits();
    }

    // @notice Check if an address is a valid grantee
    // @param _grantee The address to check
    // @return True if the address is a valid grantee, false otherwise
    function isGrantee(address _grantee) public view returns (bool) {
        return grantees[_grantee];
    }

    // @notice Distribution token address
    // @return The address of the distribution token
    function distributionToken() public view returns (address) {
        return address(pool.superToken());
    }
}