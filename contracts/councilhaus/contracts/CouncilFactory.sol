// SPDX-License-Identifier: AGPLv3
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {Council} from "./Council.sol";

contract CouncilFactory {

    event CouncilCreated(address council, address pool);

    error GDAv1ForwarderMustBeAContract();

    struct CouncilMember {
        address account;
        uint256 votingPower;
    }

    struct Grantee {
        string name;
        address account;
    }

    struct DeploymentConfig {
        string councilName;
        string councilSymbol;
        CouncilMember[] councilMembers;
        Grantee[] grantees;
        address distributionToken;
    }

    address public immutable gdav1Forwarder;

    constructor(address _gdav1Forwarder) {
        if (!isContract(_gdav1Forwarder)) revert GDAv1ForwarderMustBeAContract();
        gdav1Forwarder = _gdav1Forwarder;
    }

    function createCouncil(DeploymentConfig calldata config) public {
        Council council = new Council(config.councilName, config.councilSymbol, config.distributionToken, gdav1Forwarder);

        for (uint256 i = 0; i < config.councilMembers.length; i++) {
            council.addCouncilMember(config.councilMembers[i].account, config.councilMembers[i].votingPower);
        }
        for (uint256 i = 0; i < config.grantees.length; i++) {
            council.addGrantee(config.grantees[i].name, config.grantees[i].account);
        }

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
