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

    /**
     * Create a ticketNFT interface and mint all the tickets to the organizer
     * @param initPrice
     * @param totalTickets
     * @param from
     * @return {Promise<*>}
     */
    const createAndMintAll = async (initPrice, totalTickets, from) => {
        const ticketInterface = await createTicketNFT(initPrice, totalTickets, from)
        await ticketInterface.mint(organizer, totalTickets, { from: organizer })
        return ticketInterface
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

    it("Can get the tickets of an account", async () => {
        const initPrice = 50
        const totalTickets = 10
        const ticketInterface = await createTicketNFT(initPrice, totalTickets, organizer)

        let ticketsOfOrganizer = await ticketInterface.getTicketsOfAccount(organizer)
        assert.strictEqual(ticketsOfOrganizer.length, 0, "Before minting there should be no ticket")

        const ticketsToMint = 5
        await ticketInterface.mint(organizer, ticketsToMint, { from: organizer })

        ticketsOfOrganizer = await ticketInterface.getTicketsOfAccount(organizer)
        assert.strictEqual(ticketsOfOrganizer.length, ticketsToMint, "There should be 5 tickets")
        for (const ticket of ticketsOfOrganizer) {
            assert.strictEqual(ticket.price, initPrice.toString())
            assert.strictEqual(ticket.owner, organizer)
        }
    })

    describe("Selling tickets", () => {
        const initPrice = 100
        const totalTickets = 10
        let organizerTickets, ticketInterface

        before(async () => {
            ticketInterface = await createAndMintAll(initPrice, totalTickets, organizer)
            organizerTickets = await ticketInterface.getTicketsOfAccount(organizer)
        })

        it("Organizer can sell one ticket to alice", async () => {
            assert.strictEqual(organizerTickets.length, totalTickets, "Should have all the tickets")
            // selling one ticket to alice
            const ticketToSell = organizerTickets[0].id
            await ticketInterface.sellTicket(organizer, alice, ticketToSell, initPrice, { from: organizer })
            const ticket = await ticketInterface.tickets(ticketToSell)

            assert.strictEqual(ticket.owner, alice)
            organizerTickets = await ticketInterface.getTicketsOfAccount(organizer)
            assert.strictEqual(organizerTickets.length, totalTickets - 1, "One should be sold to alice")

            const aliceTickets = await ticketInterface.getTicketsOfAccount(alice)
            assert.strictEqual(aliceTickets.length, 1)
            assert.strictEqual(aliceTickets[0].id, ticketToSell)
        })

        it("Wont let alice sell a ticket to the organizer", async () => {
            const [aliceTicket] = await ticketInterface.getTicketsOfAccount(alice)
            assert(aliceTicket, "Should have one ticket")
            await assert.rejects(ticketInterface.sellTicket(alice, organizer, aliceTicket.id, initPrice, { from: alice }),
                /Can't sell to the organizer/)
        })

        it("wont let alice sell a ticket she doesn't own", async () => {
            const [aliceTicket] = await ticketInterface.getTicketsOfAccount(alice)
            assert(aliceTicket, "Should have one ticket")
            const ticketToSell = organizerTickets[0]
            assert(ticketToSell.id.toString() !== aliceTicket.id.toString())
            await assert.rejects(ticketInterface.sellTicket(alice, bob, ticketToSell.id, initPrice, { from: alice }),
                /ERC721: transfer of token that is not own/)
        })

        it("Wont let alice sell ticket to a higher price than 110%", async () => {
            const [aliceTicket] = await ticketInterface.getTicketsOfAccount(alice)
            assert(aliceTicket, "Should have one ticket")
            const sellingPrice = Number(aliceTicket.price.toString())*2
            await assert.rejects(ticketInterface.sellTicket(alice, bob, aliceTicket.id, sellingPrice, { from: alice }),
                /Price is higher than 110% of previous sale/)
        })

        it("Wont let the organizer sell the ticket of alice", async () => {
            const [aliceTicket] = await ticketInterface.getTicketsOfAccount(alice)
            assert(aliceTicket, "Should have one ticket")

            await assert.rejects(ticketInterface.sellTicket(alice, bob, aliceTicket.id, initPrice, { from: organizer }),
                /Only owner of ticket can sell/)
        })

        it("Lets alice sell their ticket to bob", async () => {
            const [aliceTicket] = await ticketInterface.getTicketsOfAccount(alice)
            assert(aliceTicket, "Should have one ticket")
            const sellingPrice = Math.floor(Number(aliceTicket.price.toString()) + Number(aliceTicket.price.toString())*8/100)
            await ticketInterface.sellTicket(alice, bob, aliceTicket.id, sellingPrice, { from: alice })

            const aliceTickets = await ticketInterface.getTicketsOfAccount(alice)
            assert.strictEqual(aliceTickets.length, 0, "Alice shouldnt have any more tickets")
            const bobTickets = await ticketInterface.getTicketsOfAccount(bob)
            assert.strictEqual(bobTickets.length, 1, 'Should have the ticket')
            assert.strictEqual(bobTickets[0].id, aliceTicket.id, 'The ticket is from alice')
            assert.strictEqual(bobTickets[0].price, sellingPrice.toString())
        })
    })
});
