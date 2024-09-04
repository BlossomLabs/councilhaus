// SPDX-License-Identifier: AGPLv3
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract NonTransferableToken is ERC20 {

    error CantTransferToken();
    error CantApproveToken();

    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
    {}

    function transfer(address to, uint256 value) public virtual override returns (bool) {
        to;
        value;
        revert CantTransferToken();
    }

    function transferFrom(address from, address to, uint256 value) public virtual override returns (bool) {
        from;
        to;
        value;
        revert CantTransferToken();
    }

    function approve(address spender, uint256 value) public virtual override returns (bool) {
        spender;
        value;
        revert CantApproveToken();
    }
}
