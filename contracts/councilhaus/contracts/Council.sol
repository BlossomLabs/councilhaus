// SPDX-License-Identifier: AGPLv3
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


import {GDAv1Forwarder, PoolConfig} from "./interfaces/GDAv1Forwarder.sol";
import {ISuperfluidPool} from "./interfaces/ISuperfluidPool.sol";
import {NonTransferableToken} from "./NonTransferableToken.sol";

contract Council is NonTransferableToken, AccessControl {

    error PoolCreationFailed();

    struct Allocation {
        address[] grantees;
        uint128[] amounts;
    }

    modifier updatePoolUnits(address _member) {
        Allocation memory _allocation = _allocations[_member];
        for (uint256 i = 0; i < _allocation.grantees.length; i++) {
            pool.updateMemberUnits(_allocation.grantees[i], pool.getUnits(_allocation.grantees[i]) - _allocation.amounts[i]);
        }
        _;
        _allocation = _allocations[_member];
        for (uint256 i = 0; i < _allocation.grantees.length; i++) {
            pool.updateMemberUnits(_allocation.grantees[i], pool.getUnits(_allocation.grantees[i]) + _allocation.amounts[i]);
        }
    }

    GDAv1Forwarder public immutable gdav1Forwarder;

    uint256 public constant MAX_ALLOCATIONS_PER_HOLDER = 10;
    bytes32 public constant MEMBER_MANAGER_ROLE = keccak256("MEMBER_MANAGER_ROLE");
    bytes32 public constant GRANTEE_MANAGER_ROLE = keccak256("GRANTEE_MANAGER_ROLE");

    ISuperfluidPool public pool;
    uint256 maxAllocationsPerHolder;
    mapping(address => bool) internal grantees;
    mapping(address => uint256) internal _allocatedBy;
    mapping(address => Allocation) internal _allocations;
    uint256 public totalAllocated;
    uint256 public quorum;
    int96 public flowRate;

    constructor(string memory _name, string memory _symbol, address _distributionToken, GDAv1Forwarder _gdav1Forwarder)
        NonTransferableToken(_name, _symbol)
    {
        gdav1Forwarder = _gdav1Forwarder;
        (bool _success, address _pool) = _gdav1Forwarder.createPool(_distributionToken, address(this), PoolConfig({
            transferabilityForUnitsOwner: false,
            distributionFromAnyAddress: false
        }));
        if (!_success) revert PoolCreationFailed();
        pool = ISuperfluidPool(_pool);
        maxAllocationsPerHolder = MAX_ALLOCATIONS_PER_HOLDER;
        quorum = 0.5e18;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MEMBER_MANAGER_ROLE, msg.sender);
        _grantRole(GRANTEE_MANAGER_ROLE, msg.sender);
    }

    function setMaxAllocationsPerHolder(uint256 _maxAllocationsPerHolder) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_maxAllocationsPerHolder > 0, "Max allocations per holder must be greater than 0");
        require(_maxAllocationsPerHolder <= MAX_ALLOCATIONS_PER_HOLDER, "Max allocations per holder must be less than or equal to MAX_ALLOCATIONS_PER_HOLDER");
        maxAllocationsPerHolder = _maxAllocationsPerHolder;
    }

    function setQuorum(uint256 _quorum) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_quorum > 0, "Quorum must be greater than 0");
        require(_quorum <= 1e18, "Quorum must be less than or equal to 1e18");
        quorum = _quorum;
    }

    function setFlowRate(int96 _flowRate) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_flowRate > 0, "Flow rate must be greater than 0");
        flowRate = _flowRate;
        if (isQuorumMet()) {
            executeBudget();
        }
    }

    function addCouncilMember(address _member, uint256 _votingPower) public onlyRole(MEMBER_MANAGER_ROLE) {
        _mint(_member, _votingPower);
    }

    function removeCouncilMember(address _member) public onlyRole(MEMBER_MANAGER_ROLE) updatePoolUnits(_member) {
        _burn(_member, balanceOf(_member));
        delete _allocations[_member];
    }

    function addGrantee(address _grantee) public onlyRole(GRANTEE_MANAGER_ROLE) {
        grantees[_grantee] = true;
    }

    function removeGrantee(address _grantee) public onlyRole(GRANTEE_MANAGER_ROLE) {
        grantees[_grantee] = false;
        pool.updateMemberUnits(_grantee, 0);
    }

    function allocateBudget(Allocation memory _allocation) public updatePoolUnits(msg.sender) {
        uint256 balance = balanceOf(msg.sender);
        require(balance > 0, "Holder must have a balance greater than 0");
        require(_allocation.grantees.length <= maxAllocationsPerHolder, "Too many allocations");
        require(_allocation.grantees.length == _allocation.amounts.length, "Grantees and amounts must be of equal length");
        uint256 _totalAllocated = 0;
        for (uint256 i = 0; i < _allocation.grantees.length; i++) {
            require(grantees[_allocation.grantees[i]], "Grantee not found");
            require(_allocation.amounts[i] > 0, "Amount must be greater than 0");
            _totalAllocated += _allocation.amounts[i];
        }
        require(totalAllocated <= balance, "Total allocated amount must be less than or equal to the holder's balance");
        _allocations[msg.sender] = _allocation;
        _allocatedBy[msg.sender] = _totalAllocated;
        totalAllocated += _totalAllocated;
    }

    function allocateBudget(Allocation memory _allocation, bool _executeIfAllAllocated) public {
        allocateBudget(_allocation);
        if (_executeIfAllAllocated && isQuorumMet()) {
            executeBudget();
        }
    }

    function executeBudget() public {
        require(isQuorumMet(), "Quorum not met");
        gdav1Forwarder.distributeFlow(pool.superToken(), msg.sender, address(pool), flowRate, bytes(""));
    }

    function withdraw(address _token, uint256 _amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(_token).transfer(msg.sender, _amount);
    }

    function getAllocation(address _grantee) public view returns (Allocation memory) {
        return _allocations[_grantee];
    }

    function isGrantee(address _grantee) public view returns (bool) {
        return grantees[_grantee];
    }

    function isQuorumMet() public view returns (bool) {
        return totalAllocated >= quorum * totalSupply() / 1e18;
    }
}
