// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TicketNFT is ERC721 {
    using Counters for Counters.Counter;

    Counters.Counter private ticketIds;

    struct Ticket {
        uint256 price; // current Value of the ticket (latest price the ticket was bought for)
        uint256 sellingPrice; // price to pay to buy the ticket is foSale
        uint256 id; // for querying purposes
        bool forSale;
    }

    mapping(uint256 => Ticket) public tickets; // ticketId to ticket
    mapping(address => uint256[]) public accountToTickets;
    uint256 public totalTickets;
    uint256 public initTicketPrice;
    address private organizer;

    constructor (address _organizer, uint256 _initTicketPrice, uint256 _totalTickets) ERC721 ("FestivalNFT", "FST") {
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

    function mint (uint256 _numberOfTicket) public virtual onlyOrganizer onlyWhenTicketsAvailable(_numberOfTicket){
        for (uint i = 0; i < _numberOfTicket; i++) {
            ticketIds.increment();
            uint256 ticketId = ticketIds.current();
            _safeMint(organizer, ticketId);
            tickets[ticketId] = Ticket({
                price: initTicketPrice,
                sellingPrice: initTicketPrice,
                id: ticketId,
                forSale: true
            });
            accountToTickets[organizer].push(ticketId);
        }
    }


    function canSellTicketForPrice (uint256 _ticketId, uint256 _sellingPrice) public view returns (bool) {
        require(tickets[_ticketId].price != 0, 'Ticket id not found');
        return _sellingPrice < (tickets[_ticketId].price * 110) / 100;
    }

    function setTicketForSale (uint256 _ticketId, bool _forSale, uint256 _sellingPrice) public {
        require(ownerOf(_ticketId) == msg.sender, "should be the owner of the ticket");
        tickets[_ticketId].forSale = _forSale;
        require(canSellTicketForPrice(_ticketId, _sellingPrice), "Price is higher than 110% of previous sale");
        tickets[_ticketId].sellingPrice = _sellingPrice;
    }

    function buyTicket(uint256 _ticketId) public {
        require(msg.sender != organizer, "Organizer cant buy tickets");
        require(ownerOf(_ticketId) != msg.sender, "You already own this ticket");
        require(tickets[_ticketId].forSale, "Ticket is not for sale");
        _transfer(ownerOf(_ticketId), msg.sender, _ticketId);
        tickets[_ticketId].price = tickets[_ticketId].sellingPrice;
        tickets[_ticketId].forSale = false;
        accountToTickets[msg.sender].push(_ticketId);
        // We dont remove the ticketId from the accountToTickets[_from] because it is very expensive
        // Querying shouldn't be done in the blockchain in the first place
        // Implementing a server that can act as a cache is the ideal solution
    }

    function getTicketsOfAccount (address _account) public view returns(Ticket[] memory) {
        uint256 balanceOfAccount = ERC721.balanceOf(_account);
        Ticket[] memory ticketsOfAccount = new Ticket[](balanceOfAccount);

        // filtering the one that the account owned, because we didnt remove the sold tickets
        // This is done instead of popping because it is less expensive
        uint256 totalFound = 0;
        uint totalPossibleTicketsOwnedNumber = accountToTickets[_account].length;
        for (uint256 i = 0; i < totalPossibleTicketsOwnedNumber; i++) {
            uint256 ticketId = accountToTickets[_account][i];
            if (ownerOf(ticketId) == _account) {
                ticketsOfAccount[totalFound] = tickets[ticketId];
                totalFound += 1;
                if (balanceOfAccount == totalFound) { // optimization
                    return ticketsOfAccount;
                }
            }
        }
        return ticketsOfAccount;
    }

    function getPriceOfTicket (uint256 _ticketId) public view returns(uint256) {
        return tickets[_ticketId].sellingPrice;
    }
}
