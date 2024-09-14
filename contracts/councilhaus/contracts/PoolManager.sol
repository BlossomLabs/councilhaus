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
    error GranteeNotFound();

    // Grantee counter for unique IDs
    uint256 private granteeCounter;

    // Mapping from grantee address to grantee ID
    mapping(address => uint256) private granteeIds;

    // Mapping from grantee ID to grantee address
    mapping(uint256 => address) private granteeAddresses;

    // Mapping to store allocations for each member
    // Internal allocations use grantee IDs instead of addresses
    struct InternalAllocation {
        uint256[] granteeIds;
        uint128[] amounts;
    }

    mapping(address => InternalAllocation) private _internalAllocations;

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
        uint256 granteeId = ++granteeCounter;
        granteeAddresses[granteeId] = _grantee;
        granteeIds[_grantee] = granteeId;
    }

    // @dev function to remove a grantee
    // @param _grantee The address of the grantee to be removed
    function _removeGrantee(address _grantee) internal {
        uint256 granteeId = granteeIds[_grantee];
        if (granteeId == 0) revert GranteeNotFound();
        delete granteeAddresses[granteeId];
        delete granteeIds[_grantee];
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
        InternalAllocation storage allocation = _internalAllocations[_member];
        // Count valid grantees
        uint256 count = 0;
        for (uint256 i = 0; i < allocation.granteeIds.length; i++) {
            address granteeAddress = granteeAddresses[allocation.granteeIds[i]];
            if (isGrantee(granteeAddress)) {
                count++;
            }
        }

        // Create arrays of the correct size
        address[] memory granteesCopy = new address[](count);
        uint128[] memory amountsCopy = new uint128[](count);

        // Fill the arrays with valid grantees and amounts
        uint256 index = 0;
        uint256 sum = 0;
        for (uint256 i = 0; i < allocation.granteeIds.length; i++) {
            address granteeAddress = granteeAddresses[allocation.granteeIds[i]];
            if (isGrantee(granteeAddress)) {
                granteesCopy[index] = granteeAddress;
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
        // First, remove old allocations from the pool
        InternalAllocation storage _allocation = _internalAllocations[_member];
        for (uint256 i = 0; i < _allocation.granteeIds.length; i++) {
            if (granteeAddresses[_allocation.granteeIds[i]] != address(0)) {
                address granteeAddress = granteeAddresses[
                    _allocation.granteeIds[i]
                ];
                pool.updateMemberUnits(
                    granteeAddress,
                    pool.getUnits(granteeAddress) - _allocation.amounts[i]
                );
            }
        }
        // Map new allocation addresses to grantee IDs
        uint256[] memory granteeIdsArray = new uint256[](
            _newAllocation.accounts.length
        );
        for (uint256 i = 0; i < _newAllocation.accounts.length; i++) {
            address granteeAddress = _newAllocation.accounts[i];
            uint256 granteeId = granteeIds[granteeAddress];
            if (granteeId == 0) revert GranteeNotFound();
            granteeIdsArray[i] = granteeId;
        }
        // Set the new internal allocation
        _internalAllocations[_member] = InternalAllocation({
            granteeIds: granteeIdsArray,
            amounts: _newAllocation.amounts
        });
        // Update the pool units with the new allocation
        for (uint256 i = 0; i < granteeIdsArray.length; i++) {
            address granteeAddress = granteeAddresses[granteeIdsArray[i]];
            pool.updateMemberUnits(
                granteeAddress,
                pool.getUnits(granteeAddress) + _newAllocation.amounts[i]
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
        return granteeIds[_grantee] != 0;
    }

    // @notice Distribution token address
    // @return The address of the distribution token
    function distributionToken() public view returns (address) {
        return address(pool.superToken());
    }
}
