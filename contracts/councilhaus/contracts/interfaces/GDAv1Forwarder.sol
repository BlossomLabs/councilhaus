// SPDX-License-Identifier: AGPLv3
pragma solidity ^0.8.20;

struct PoolConfig {
    /// @dev if true, the pool members can transfer their owned units
    /// else, only the pool admin can manipulate the units for pool members
    bool transferabilityForUnitsOwner;
    /// @dev if true, anyone can execute distributions via the pool
    /// else, only the pool admin can execute distributions via the pool
    bool distributionFromAnyAddress;
}

/**
 * @title GDAv1Forwarder
 * @author Superfluid
 * The GDAv1Forwarder contract provides an easy to use interface to
 * GeneralDistributionAgreementV1 specific functionality of Super Tokens.
 * Instances of this contract can operate on the protocol only if configured as "trusted forwarder"
 * by protocol governance.
 */
interface GDAv1Forwarder {

    /**
     * @dev Creates a new Superfluid Pool.
     * @param token The Super Token address.
     * @param admin The pool admin address.
     * @param config The pool configuration (see PoolConfig in IGeneralDistributionAgreementV1.sol)
     * @return success A boolean value indicating whether the pool was created successfully.
     * @return pool The address of the deployed Superfluid Pool
     */
    function createPool(
        address token,
        address admin,
        PoolConfig memory config
    ) external returns (bool success, address pool);

    /**
     * @dev Updates the units of a pool member.
     * @param pool The Superfluid Pool to update.
     * @param memberAddress The address of the member to update.
     * @param newUnits The new units of the member.
     * @param userData User-specific data.
     */
    function updateMemberUnits(
        address pool,
        address memberAddress,
        uint128 newUnits,
        bytes memory userData
    ) external returns (bool success);

    /**
     * @dev Claims all tokens from the pool.
     * @param pool The Superfluid Pool to claim from.
     * @param memberAddress The address of the member to claim for.
     * @param userData User-specific data.
     */
    function claimAll(
        address pool,
        address memberAddress,
        bytes memory userData
    ) external returns (bool success);

    /**
     * @dev Connects a pool member to `pool`.
     * @param pool The Superfluid Pool to connect.
     * @param userData User-specific data.
     * @return A boolean value indicating whether the connection was successful.
     */
    function connectPool(
        address pool,
        bytes memory userData
    ) external returns (bool);

    /**
     * @dev Disconnects a pool member from `pool`.
     * @param pool The Superfluid Pool to disconnect.
     * @param userData User-specific data.
     * @return A boolean value indicating whether the disconnection was successful.
     */
    function disconnectPool(
        address pool,
        bytes memory userData
    ) external returns (bool);

    /**
     * @dev Tries to distribute `requestedAmount` amount of `token` from `from` to `pool`.
     * @param token The Super Token address.
     * @param from The address from which to distribute tokens.
     * @param pool The Superfluid Pool address.
     * @param requestedAmount The amount of tokens to distribute.
     * @param userData User-specific data.
     * @return A boolean value indicating whether the distribution was successful.
     */
    function distribute(
        address token,
        address from,
        address pool,
        uint256 requestedAmount,
        bytes memory userData
    ) external returns (bool);

    /**
     * @dev Tries to distribute flow at `requestedFlowRate` of `token` from `from` to `pool`.
     * @param token The Super Token address.
     * @param from The address from which to distribute tokens.
     * @param pool The Superfluid Pool address.
     * @param requestedFlowRate The flow rate of tokens to distribute.
     * @param userData User-specific data.
     * @return A boolean value indicating whether the distribution was successful.
     */
    function distributeFlow(
        address token,
        address from,
        address pool,
        int96 requestedFlowRate,
        bytes memory userData
    ) external returns (bool);

    /**
     * @dev Checks if the specified account is a pool.
     * @param token The Super Token address.
     * @param account The account address to check.
     * @return A boolean value indicating whether the account is a pool.
     */
    function isPool(
        address token,
        address account
    ) external view returns (bool);

    /**
     * @dev Gets the GDA net flow rate for the specified account.
     * @param token The Super Token address.
     * @param account The account address.
     * @return The gda net flow rate for the account.
     */
    function getNetFlow(
        address token,
        address account
    ) external view returns (int96);

    /**
     * @dev Gets the flow rate of tokens between the specified accounts.
     * @param token The Super Token address.
     * @param from The sender address.
     * @param to The receiver address (the pool address).
     * @return The flow distribution flow rate
     */
    function getFlowDistributionFlowRate(
        address token,
        address from,
        address to
    ) external view returns (int96);

    /**
     * @dev Gets the pool adjustment flow rate for the specified pool.
     * @param pool The pool address.
     * @return The pool adjustment flow rate.
     */
    function getPoolAdjustmentFlowRate(
        address pool
    ) external view returns (int96);

    /**
     * @dev Estimates the actual flow rate for flow distribution to the specified pool.
     * @param token The Super Token address.
     * @param from The sender address.
     * @param to The pool address.
     * @param requestedFlowRate The requested flow rate.
     * @return actualFlowRate
     * @return totalDistributionFlowRate
     */
    function estimateFlowDistributionActualFlowRate(
        address token,
        address from,
        address to,
        int96 requestedFlowRate
    )
        external
        view
        returns (int96 actualFlowRate, int96 totalDistributionFlowRate);

    /**
     * @dev Estimates the actual amount for distribution to the specified pool.
     * @param token The Super Token address.
     * @param from The sender address.
     * @param to The pool address.
     * @param requestedAmount The requested amount.
     * @return actualAmount The actual amount for distribution.
     */
    function estimateDistributionActualAmount(
        address token,
        address from,
        address to,
        uint256 requestedAmount
    ) external view returns (uint256 actualAmount);

    /**
     * @dev Checks if the specified member is connected to the pool.
     * @param pool The Superfluid Pool address.
     * @param member The member address.
     * @return A boolean value indicating whether the member is connected to the pool.
     */
    function isMemberConnected(
        address pool,
        address member
    ) external view returns (bool);

    /**
     * @dev Gets the pool adjustment flow information for the specified pool.
     * @param pool The pool address.
     * @return The pool admin, pool ID, and pool adjustment flow rate.
     */
    function getPoolAdjustmentFlowInfo(
        address pool
    ) external view returns (address, bytes32, int96);
}
