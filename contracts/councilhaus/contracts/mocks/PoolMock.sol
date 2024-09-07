// SPDX-License-Identifier: AGPLv3
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {PoolConfig} from "../interfaces/GDAv1Forwarder.sol";

contract PoolMock {
    mapping(address => uint128) public units;
    address public superToken;
    address public admin;
    /// @notice A boolean indicating whether pool members can transfer their units
    bool public transferabilityForUnitsOwner;
    /// @notice A boolean indicating whether addresses other than the pool admin can distribute via the pool
    bool public distributionFromAnyAddress;
    uint128 public totalUnits;

    constructor(address _superToken, address _admin, PoolConfig memory _config) {
        superToken = _superToken;
        admin = _admin;
        transferabilityForUnitsOwner = _config.transferabilityForUnitsOwner;
        distributionFromAnyAddress = _config.distributionFromAnyAddress;
    }

    function updateMemberUnits(address memberAddr, uint128 newUnits) external returns (bool) {
        totalUnits -= units[memberAddr];
        units[memberAddr] = newUnits;
        totalUnits += newUnits;
        return true;
    }

    function getUnits(address member) external view returns (uint128) {
        return units[member];
    }

    function getTotalUnits() external view returns (uint128) {
        return totalUnits;
    }
}
