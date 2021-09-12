// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TicketFactory.sol";

contract Festival {
    TicketFactory public factory;
    address organizer;

    constructor () {
        organizer = msg.sender;
    }

    function createFactory (uint256 _initTicketPrice, uint256 _totalTickets) public {
        factory = new TicketFactory(_initTicketPrice, _totalTickets);
    }
}
