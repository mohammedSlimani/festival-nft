// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TicketCoin is ERC20 {
    constructor() ERC20("TicketCoint", "TCOIN") {
        _mint(msg.sender, 10000);
    }
}