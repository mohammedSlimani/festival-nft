import "./TicketNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TicketFactory is Ownable {
    event Return(address ticket);

    function create(uint256 _initTicketPrice, uint256 _totalTickets) public onlyOwner returns (TicketNFT) {
        TicketNFT ticket = new TicketNFT(msg.sender, _initTicketPrice, _totalTickets);
        emit Return(address(ticket));
        return ticket;
    }
}
