// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TicketNFT.sol";
import "./TicketCoin.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketFactory is Ownable {
    TicketNFT private ticketNFT;
    TicketCoin private ticketCoin;
    address private organizer;

    constructor (uint256 _initTicketPrice, uint256 _totalTickets) {
        organizer = msg.sender;
        ticketCoin = new TicketCoin();
        ticketNFT = new TicketNFT(organizer, _initTicketPrice, _totalTickets);
    }

    function buyTicket (uint256 _ticketId) public {
        ticketCoin.transferFrom(msg.sender, ticketNFT.ownerOf(_ticketId), ticketNFT.getPriceOfTicket(_ticketId));
        ticketNFT.buyTicket(_ticketId);
    }
}
