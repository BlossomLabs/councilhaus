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
    error InvalidMaxAllocations();
    error InvalidQuorum();
    error FlowRateMustBePositive();
    error CouncilMemberAlreadyAdded();
    error CouncilMemberNotFound();
    error TooManyAllocations();
    error GranteesAndAmountsMustBeEqualLength();
    error GranteeAlreadyAdded();
    error GranteeNotFound();
    error AmountMustBeGreaterThanZero();
    error TotalAllocatedExceedsBalance();
    error QuorumNotMet();

    event MaxAllocationsPerMemberSet(uint8 maxAllocationsPerMember);
    event QuorumSet(uint256 quorum);
    event FlowRateSet(int96 flowRate);
    event CouncilMemberAdded(address member, uint256 votingPower);
    event CouncilMemberRemoved(address member);
    event GranteeAdded(string name, address grantee);
    event GranteeRemoved(address grantee);
    event BudgetAllocated(address member, Allocation allocation);
    event BudgetExecuted();
    event Withdrawn(address token, address account, uint256 amount);

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

    uint8 public constant MAX_ALLOCATIONS_PER_MEMBER = 10;
    bytes32 public constant MEMBER_MANAGER_ROLE = keccak256("MEMBER_MANAGER_ROLE");
    bytes32 public constant GRANTEE_MANAGER_ROLE = keccak256("GRANTEE_MANAGER_ROLE");

    ISuperfluidPool public pool;
    uint8 public maxAllocationsPerMember;
    mapping(address => bool) internal grantees; // grantees[grantee] = true if the grantee is a valid grantee, false otherwise
    mapping(address => uint256) internal _allocatedBy; // _allocatedBy[member] = amount allocated by the member
    mapping(address => Allocation) internal _allocations; // _allocations[member] = { grantees: [grantee1, grantee2, ...], amounts: [amount1, amount2, ...] }
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
        maxAllocationsPerMember = MAX_ALLOCATIONS_PER_MEMBER;
        quorum = 0.5e18;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MEMBER_MANAGER_ROLE, msg.sender);
        _grantRole(GRANTEE_MANAGER_ROLE, msg.sender);

        emit MaxAllocationsPerMemberSet(MAX_ALLOCATIONS_PER_MEMBER);
        emit QuorumSet(quorum);
    }

    function setMaxAllocationsPerMember(uint8 _maxAllocationsPerMember) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_maxAllocationsPerMember <= 0 || _maxAllocationsPerMember > MAX_ALLOCATIONS_PER_MEMBER) revert InvalidMaxAllocations();
        maxAllocationsPerMember = _maxAllocationsPerMember;
        emit MaxAllocationsPerMemberSet(_maxAllocationsPerMember);
    }

    function setQuorum(uint256 _quorum) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_quorum <= 0 || _quorum > 1e18) revert InvalidQuorum();
        quorum = _quorum;
        emit QuorumSet(_quorum);
    }

    function setFlowRate(int96 _flowRate) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_flowRate < 0) revert FlowRateMustBePositive();
        flowRate = _flowRate;
        emit FlowRateSet(_flowRate);
        if (isQuorumMet()) {
            executeBudget();
        }
    }

    function addCouncilMember(address _member, uint256 _votingPower) public onlyRole(MEMBER_MANAGER_ROLE) {
        if (balanceOf(_member) > 0) revert CouncilMemberAlreadyAdded();
        if (_votingPower == 0) revert AmountMustBeGreaterThanZero();
        _mint(_member, _votingPower);
        emit CouncilMemberAdded(_member, _votingPower);
    }

    function removeCouncilMember(address _member) public onlyRole(MEMBER_MANAGER_ROLE) updatePoolUnits(_member) {
        if (balanceOf(_member) == 0) revert CouncilMemberNotFound();
        _burn(_member, balanceOf(_member));
        delete _allocations[_member];
        emit CouncilMemberRemoved(_member);
    }

    function addGrantee(string memory _name, address _grantee) public onlyRole(GRANTEE_MANAGER_ROLE) {
        if (grantees[_grantee]) revert GranteeAlreadyAdded();
        grantees[_grantee] = true;
        emit GranteeAdded(_name, _grantee);
    }

    function removeGrantee(address _grantee) public onlyRole(GRANTEE_MANAGER_ROLE) {
        if (!grantees[_grantee]) revert GranteeNotFound();
        grantees[_grantee] = false;
        pool.updateMemberUnits(_grantee, 0);
        emit GranteeRemoved(_grantee);
    }

    function allocateBudget(Allocation memory _allocation) public updatePoolUnits(msg.sender) {
        uint256 balance = balanceOf(msg.sender);
        if (balance == 0) revert CouncilMemberNotFound();
        if (_allocation.grantees.length > maxAllocationsPerMember) revert TooManyAllocations();
        if (_allocation.grantees.length != _allocation.amounts.length) revert GranteesAndAmountsMustBeEqualLength();
        uint256 _totalAllocatedBySender = 0;
        for (uint256 i = 0; i < _allocation.grantees.length; i++) {
            if (!grantees[_allocation.grantees[i]]) revert GranteeNotFound();
            if (_allocation.amounts[i] == 0) revert AmountMustBeGreaterThanZero();
            _totalAllocatedBySender += _allocation.amounts[i];
        }
        if (_totalAllocatedBySender > balance) revert TotalAllocatedExceedsBalance();
        _allocations[msg.sender] = _allocation;
        _allocatedBy[msg.sender] = _totalAllocatedBySender;
        totalAllocated += _totalAllocatedBySender;
        emit BudgetAllocated(msg.sender, _allocation);
    }

    function allocateBudget(Allocation memory _allocation, bool _executeIfAllAllocated) public {
        allocateBudget(_allocation);
        if (_executeIfAllAllocated && isQuorumMet()) {
            executeBudget();
        }
    }

    function executeBudget() public {
        if (!isQuorumMet()) revert QuorumNotMet();
        gdav1Forwarder.distributeFlow(pool.superToken(), msg.sender, address(pool), flowRate, bytes(""));
        emit BudgetExecuted();
    }

    function withdraw(address _token) public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(msg.sender, balance);
        emit Withdrawn(_token, msg.sender, balance);
    }

    function getAllocation(address _member) public view returns (Allocation memory) {
        return _allocations[_member];
    }

    function isGrantee(address _grantee) public view returns (bool) {
        return grantees[_grantee];
    }

    function isQuorumMet() public view returns (bool) {
        uint256 _totalSupply = totalSupply();
        return _totalSupply > 0 && totalAllocated >= quorum * _totalSupply / 1e18;
    }

    function distributionToken() public view returns (address) {
        return address(pool.superToken());
    }
}
