pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TicketNFT is ERC721 {
    using Counters for Counters.Counter;

    Counters.Counter private ticketIds;

    struct Ticket {
        uint256 price;
    }

    mapping(uint256 => Ticket) public tickets; // ticketId to ticket
    uint256 public totalTickets;
    uint256 public initTicketPrice;
    address private organizer;

    constructor (address _organizer, uint256 _initTicketPrice, uint256 _totalTickets) public ERC721 ("FestivalNFT", "FST") {
        organizer = _organizer;
        initTicketPrice = _initTicketPrice;
        totalTickets = _totalTickets;
    }

    /*
    ===== Modifiers ====== BEGIN
    */
    modifier onlyOrganizer {
        require(msg.sender == organizer, "You are not the organizer");
        _;
    }

    modifier onlyWhenTicketsAvailable (uint256 _numberOfTickets) {
        require(ticketIds.current() + _numberOfTickets <= totalTickets, "No more tickets available");
        _;
    }
    /*
    ===== Modifiers ====== END
    */

    function mint (address _recipient, uint256 _numberOfTicket) public virtual onlyOrganizer onlyWhenTicketsAvailable(_numberOfTicket){
        for (uint i = 0; i < _numberOfTicket; i++) {
            ticketIds.increment();
            uint256 ticketId = ticketIds.current();
            _mint(_recipient, ticketId);
            tickets[ticketId] = Ticket({
            price: initTicketPrice
            });
        }
    }
}
