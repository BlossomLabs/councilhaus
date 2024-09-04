// SPDX-License-Identifier: AGPLv3
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "hardhat/console.sol";

import {GDAv1Forwarder} from "./interfaces/GDAv1Forwarder.sol";
import {Council} from "./Council.sol";

contract CouncilFactory {

    event CouncilCreated(address council, address pool);

    error FirstMintToAndAmountLengthMismatch();
    error GDAv1ForwarderMustBeAContract();

    struct DeploymentConfig {
        string councilName;
        string councilSymbol;
        address[] firstMintTo;
        uint256[] firstMintAmount;
        address distributionToken;
        address[] grantees;
        uint256 quorum;
        int96 flowRate;
    }

    GDAv1Forwarder public immutable gdav1Forwarder;

    constructor(address _gdav1Forwarder) {
        if (!isContract(address(_gdav1Forwarder))) revert GDAv1ForwarderMustBeAContract();
        gdav1Forwarder = GDAv1Forwarder(_gdav1Forwarder);
    }

    function createCouncil(DeploymentConfig calldata config) public {
        if (config.firstMintTo.length != config.firstMintAmount.length) revert FirstMintToAndAmountLengthMismatch();
        Council council = new Council(config.councilName, config.councilSymbol, config.distributionToken, gdav1Forwarder);

        for (uint256 i = 0; i < config.firstMintTo.length; i++) {
            council.addCouncilMember(config.firstMintTo[i], config.firstMintAmount[i]);
        }
        for (uint256 i = 0; i < config.grantees.length; i++) {
            council.addGrantee(config.grantees[i]);
        }

        council.setQuorum(config.quorum);
        council.setFlowRate(config.flowRate);

        council.grantRole(council.MEMBER_MANAGER_ROLE(), msg.sender);
        council.grantRole(council.GRANTEE_MANAGER_ROLE(), msg.sender);
        council.grantRole(council.DEFAULT_ADMIN_ROLE(), msg.sender);

        council.revokeRole(council.MEMBER_MANAGER_ROLE(), address(this));
        council.revokeRole(council.GRANTEE_MANAGER_ROLE(), address(this));
        council.revokeRole(council.DEFAULT_ADMIN_ROLE(), address(this));

        emit CouncilCreated(address(council), address(council.pool()));
    }

    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(account) }
        return size > 0;
    }
}
