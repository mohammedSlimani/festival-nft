const assert = require("assert");
const TicketNFT = artifacts.require("TicketNFT")
const TicketFactory = artifacts.require("TicketFactory")

contract("TicketNFT", accounts => {
    const [organizer, alice, bob] = accounts
    let ticketFactory

    before("setting up the TicketNFT and the Factory", async function () {
        ticketFactory = await TicketFactory.new({ from: organizer })
    })

    /**
     * Helper method to create a ticketNFT interface
     * @param initPrice - the initPrice of the tickets
     * @param totalTickets - totalTickets
     * @param from - the accounts making the request
     * @return {Promise<*>}
     */
    const createTicketNFT = async (initPrice, totalTickets, from) => {
        const ticketAddress = await ticketFactory.create(initPrice, totalTickets, { from });
        return await TicketNFT.at(ticketAddress.logs[0].args.ticket)
    }

    it("lets The organizer create a ticketNFT interface", async () => {
        const initPrice = 50
        const totalTickets = 30
        const ticketInterface = await createTicketNFT(initPrice, totalTickets, organizer)

        assert.strictEqual((await ticketInterface.totalTickets()).toString(), totalTickets.toString(), 'The total ticket should be the same')
        assert.strictEqual((await ticketInterface.initTicketPrice()).toString(), initPrice.toString(), 'Init price should be the same')
    });

    it("Rejects other accounts from creating TicketNFT in the organizer's factory", async () => {
        await assert.rejects(createTicketNFT(1, 1, alice), /caller is not the owner/)
    })

    it("Lets Only the organizer mint tickets, at max the total number of tickets", async () => {
        const initPrice = 50
        const totalTickets = 30
        const ticketInterface = await createTicketNFT(initPrice, totalTickets, organizer)

        // accounts other than the organizer can't mint
        await assert.rejects(ticketInterface.mint(organizer, totalTickets, { from: alice }), /You are not the organizer/ )

        // minting all the total tickets
        await assert.doesNotReject(ticketInterface.mint(organizer, totalTickets, { from: organizer }))

        // no more tickets to mint, max reached
        await assert.rejects(ticketInterface.mint(organizer, totalTickets, { from: organizer }), /No more tickets available/)
    })
});
