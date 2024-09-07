// SPDX-License-Identifier: AGPLv3
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

// Import required OpenZeppelin contracts
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Import custom contracts
import {PoolManager} from "./PoolManager.sol";
import {NonTransferableToken} from "./NonTransferableToken.sol";

// Define the Allocation struct to represent budget allocations
struct Allocation {
    address[] accounts;
    uint128[] amounts;
}

/**
 * @title Council
 * @dev A contract for managing a council with voting power, budget allocation, and grantee management
 * Inherits from NonTransferableToken, AccessControl, and PoolManager
 */
contract Council is NonTransferableToken, AccessControl, PoolManager {
    // Custom error definitions
    error InvalidMaxAllocations();
    error FlowRateMustBePositive();
    error CouncilMemberAlreadyAdded();
    error CouncilMemberNotFound();
    error TooManyAllocations();
    error ArraysLengthMismatch();
    error GranteeAlreadyAdded();
    error GranteeNotFound();
    error AmountMustBeGreaterThanZero();
    error TotalAllocatedExceedsBalance();

    // Event definitions
    event MaxAllocationsPerMemberSet(uint8 maxAllocationsPerMember);
    event FlowRateSet(int96 flowRate);
    event CouncilMemberAdded(address member, uint256 votingPower);
    event CouncilMemberRemoved(address member);
    event GranteeAdded(string name, address grantee);
    event GranteeRemoved(address grantee);
    event BudgetAllocated(address member, Allocation allocation);
    event BudgetExecuted();
    event Withdrawn(address token, address account, uint256 amount);

    // Constants
    uint8 public constant MAX_ALLOCATIONS_PER_MEMBER = 10;
    bytes32 public constant MEMBER_MANAGER_ROLE = keccak256("MEMBER_MANAGER_ROLE");
    bytes32 public constant GRANTEE_MANAGER_ROLE = keccak256("GRANTEE_MANAGER_ROLE");

    // State variables
    address public gdav1Forwarder;
    uint8 public maxAllocationsPerMember;

    /**
     * @dev Constructor to initialize the Council contract
     * @param _name Name of the non-transferable token
     * @param _symbol Symbol of the non-transferable token
     * @param _distributionToken Address of the token used for distribution
     * @param _gdav1Forwarder Address of the GDAv1Forwarder contract
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _distributionToken,
        address _gdav1Forwarder
    )
        NonTransferableToken(_name, _symbol)
        PoolManager(_distributionToken, _gdav1Forwarder)
    {
        gdav1Forwarder = _gdav1Forwarder;
        maxAllocationsPerMember = MAX_ALLOCATIONS_PER_MEMBER;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MEMBER_MANAGER_ROLE, msg.sender);
        _grantRole(GRANTEE_MANAGER_ROLE, msg.sender);

        emit MaxAllocationsPerMemberSet(MAX_ALLOCATIONS_PER_MEMBER);
    }

    /**
     * @dev Set the maximum number of allocations per member
     * @param _maxAllocationsPerMember New maximum allocations per member
     */
    function setMaxAllocationsPerMember(
        uint8 _maxAllocationsPerMember
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (
            _maxAllocationsPerMember <= 0 ||
            _maxAllocationsPerMember > MAX_ALLOCATIONS_PER_MEMBER
        ) revert InvalidMaxAllocations();
        maxAllocationsPerMember = _maxAllocationsPerMember;
        emit MaxAllocationsPerMemberSet(_maxAllocationsPerMember);
    }

    /**
     * @notice Add a new council member
     * @param _member Address of the new council member
     * @param _votingPower Voting power of the new council member
     */
    function addCouncilMember(
        address _member,
        uint256 _votingPower
    ) public onlyRole(MEMBER_MANAGER_ROLE) {
        if (balanceOf(_member) > 0) revert CouncilMemberAlreadyAdded();
        if (_votingPower == 0) revert AmountMustBeGreaterThanZero();
        _mint(_member, _votingPower);
        emit CouncilMemberAdded(_member, _votingPower);
    }

    /**
     * @notice Remove a council member
     * @param _member Address of the council member to remove
     */
    function removeCouncilMember(
        address _member
    ) public onlyRole(MEMBER_MANAGER_ROLE) {
        if (balanceOf(_member) == 0) revert CouncilMemberNotFound();
        _burn(_member, balanceOf(_member));
        _setAllocation(
            _member,
            Allocation({accounts: new address[](0), amounts: new uint128[](0)})
        );
        emit CouncilMemberRemoved(_member);
    }

    /**
     * @notice Add a new grantee
     * @param _name Name of the grantee
     * @param _grantee Address of the grantee
     */
    function addGrantee(
        string memory _name,
        address _grantee
    ) public onlyRole(GRANTEE_MANAGER_ROLE) {
        if (isGrantee(_grantee)) revert GranteeAlreadyAdded();
        _addGrantee(_grantee);
        emit GranteeAdded(_name, _grantee);
    }

    /**
     * @notice Remove a grantee
     * @param _grantee Address of the grantee to remove
     */
    function removeGrantee(
        address _grantee
    ) public onlyRole(GRANTEE_MANAGER_ROLE) {
        if (!isGrantee(_grantee)) revert GranteeNotFound();
        _removeGrantee(_grantee);
        emit GranteeRemoved(_grantee);
    }

    /**
     * @notice Allocate budget for grantees
     * @param _allocation Allocation struct containing grantee addresses and amounts
     */
    function allocateBudget(Allocation memory _allocation) public {
        uint256 balance = balanceOf(msg.sender);
        if (balance == 0) revert CouncilMemberNotFound();
        if (_allocation.accounts.length > maxAllocationsPerMember)
            revert TooManyAllocations();
        if (_allocation.accounts.length != _allocation.amounts.length)
            revert ArraysLengthMismatch();
        uint256 _totalAllocatedBySender = 0;
        for (uint256 i = 0; i < _allocation.accounts.length; i++) {
            if (!isGrantee(_allocation.accounts[i])) revert GranteeNotFound();
            if (_allocation.amounts[i] == 0)
                revert AmountMustBeGreaterThanZero();
            _totalAllocatedBySender += _allocation.amounts[i];
        }
        if (_totalAllocatedBySender > balance)
            revert TotalAllocatedExceedsBalance();
        _setAllocation(msg.sender, _allocation);
        emit BudgetAllocated(msg.sender, _allocation);
    }

    /**
     * @notice Withdraw tokens from the contract
     * @param _token Address of the token to withdraw
     */
    function withdraw(address _token) public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(msg.sender, balance);
        emit Withdrawn(_token, msg.sender, balance);
    }

    /**
     * @notice Get the allocation details for a council member
     * @param _member Address of the council member
     * @return allocation Allocation struct for the member
     * @return sum Total amount allocated by the member
     * @return balance Voting power balance of the member
     */
    function getAllocation(
        address _member
    )
        public
        view
        returns (Allocation memory allocation, uint256 sum, uint256 balance)
    {
        (allocation, sum) = _getAllocation(_member);
        return (allocation, sum, balanceOf(_member));
    }
}
