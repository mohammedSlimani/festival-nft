const assert = require("assert");
const TicketNFT = artifacts.require("TicketNFT")
const TicketFactory = artifacts.require("TicketFactory")

contract("TicketNFT", accounts => {
    const [organizer, alice, bob] = accounts
    let ticketFactory

    /**
     * Helper method to create a ticketNFT interface
     * @param initPrice - the initPrice of the tickets
     * @param totalTickets - totalTickets
     * @param from - the accounts making the request
     * @return {Promise<*>}
     */
    const createTicketNFT = async (initPrice, totalTickets, from) => {
        return await TicketNFT.new(from, initPrice, totalTickets, { from });
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
        await ticketInterface.mint(totalTickets, { from: organizer })
        return ticketInterface
    }

    it("lets The organizer create a ticketNFT interface", async () => {
        const initPrice = 50
        const totalTickets = 30
        const ticketInterface = await createTicketNFT(initPrice, totalTickets, organizer)

        assert.strictEqual((await ticketInterface.totalTickets()).toString(), totalTickets.toString(), 'The total ticket should be the same')
        assert.strictEqual((await ticketInterface.initTicketPrice()).toString(), initPrice.toString(), 'Init price should be the same')
    });

    it("Lets Only the organizer mint tickets, at max the total number of tickets", async () => {
        const initPrice = 50
        const totalTickets = 30
        const ticketInterface = await createTicketNFT(initPrice, totalTickets, organizer)

        // accounts other than the organizer can't mint
        await assert.rejects(ticketInterface.mint(totalTickets, { from: alice }), /You are not the organizer/ )

        // minting all the total tickets
        await assert.doesNotReject(ticketInterface.mint(totalTickets, { from: organizer }))

        // no more tickets to mint, max reached
        await assert.rejects(ticketInterface.mint(totalTickets, { from: organizer }), /No more tickets available/)
    })

    it("Can get the tickets of an account", async () => {
        const initPrice = 50
        const totalTickets = 10
        const ticketInterface = await createTicketNFT(initPrice, totalTickets, organizer)

        let ticketsOfOrganizer = await ticketInterface.getTicketsOfAccount(organizer)
        assert.strictEqual(ticketsOfOrganizer.length, 0, "Before minting there should be no ticket")

        const ticketsToMint = 5
        await ticketInterface.mint(ticketsToMint, { from: organizer })

        ticketsOfOrganizer = await ticketInterface.getTicketsOfAccount(organizer)
        assert.strictEqual(ticketsOfOrganizer.length, ticketsToMint, "There should be 5 tickets")
        for (const ticket of ticketsOfOrganizer) {
            assert.strictEqual(ticket.price, initPrice.toString())
        }
    })

    describe("Buying tickets", () => {
        const initPrice = 100
        const totalTickets = 10
        let organizerTickets, ticketInterface

        before(async () => {
            ticketInterface = await createAndMintAll(initPrice, totalTickets, organizer)
            organizerTickets = await ticketInterface.getTicketsOfAccount(organizer)
            assert.strictEqual(organizerTickets.length, totalTickets, "Should have all the tickets")
        })

        it("Wont allow the organizer to buy tickets", async () => {
            await assert.rejects(ticketInterface.buyTicket(organizerTickets[0].id, { from: organizer }),
                /Organizer cant buy tickets/)
        })

        it("Alice can buy one ticket from the organizer", async () => {
            // buying the first ticket
            const ticketToSell = organizerTickets[0].id
            await ticketInterface.buyTicket(ticketToSell, { from: alice })
            const ticket = await ticketInterface.tickets(ticketToSell)

            assert.strictEqual(await ticketInterface.ownerOf(ticket.id), alice)
            organizerTickets = await ticketInterface.getTicketsOfAccount(organizer)
            assert.strictEqual(organizerTickets.length, totalTickets - 1, "One should be sold to alice")

            const aliceTickets = await ticketInterface.getTicketsOfAccount(alice)
            assert.strictEqual(aliceTickets.length, 1)
            assert.strictEqual(aliceTickets[0].id, ticketToSell)
        })

        it("Wont let anyone that is not the owner of a ticket to set it to sale", async () => {
            const [aliceTicket] = await ticketInterface.getTicketsOfAccount(alice)
            assert(aliceTicket, "Should have one ticket")

            await assert.rejects(ticketInterface.setTicketForSale(aliceTicket.id, true, 0, { from: bob }),
                /should be the owner of the ticket/)
        })

        it("Wont let bob buy a ticket that is not for sale", async () => {
            const [aliceTicket] = await ticketInterface.getTicketsOfAccount(alice)
            assert(aliceTicket, "Should have one ticket")
            await assert.rejects(ticketInterface.buyTicket(aliceTicket.id, { from: bob }),
                /Ticket is not for sale/)
        })

        it("Wont let alice set ticket selling price higher than 110% of previous one", async () => {
            const [aliceTicket] = await ticketInterface.getTicketsOfAccount(alice)
            assert(aliceTicket, "Should have one ticket")
            const sellingPrice = Number(aliceTicket.price.toString())*2
            await assert.rejects(ticketInterface.setTicketForSale(aliceTicket.id, true, sellingPrice, { from: alice }),
                /Price is higher than 110% of previous sale/)
        })

        it("lets alice set her ticket for sale", async () => {
            let [aliceTicket] = await ticketInterface.getTicketsOfAccount(alice)
            assert(aliceTicket, "Should have one ticket")
            const sellingPrice = Math.floor(Number(aliceTicket.price.toString()) + Number(aliceTicket.price.toString())*8/100)

            await assert.doesNotReject(ticketInterface.setTicketForSale(aliceTicket.id, true, sellingPrice, {from: alice}));

            [aliceTicket] = await ticketInterface.getTicketsOfAccount(alice)
            assert(aliceTicket)
            assert.strictEqual(aliceTicket.forSale.toString(), true.toString())
            assert.strictEqual(aliceTicket.sellingPrice.toString(), sellingPrice.toString())
        })

        it("Bob can buy the ticket from alice", async () => {
            const [aliceTicket] = await ticketInterface.getTicketsOfAccount(alice)
            assert(aliceTicket, "Should have one ticket")

            await ticketInterface.buyTicket(aliceTicket.id, { from: bob })

            const aliceTickets = await ticketInterface.getTicketsOfAccount(alice)
            assert.strictEqual(aliceTickets.length, 0, "Alice shouldnt have any more tickets")
            const bobTickets = await ticketInterface.getTicketsOfAccount(bob)
            assert.strictEqual(bobTickets.length, 1, 'Should have the ticket')
            assert.strictEqual(bobTickets[0].id, aliceTicket.id, 'The ticket is from alice')
            assert.strictEqual(bobTickets[0].price, bobTickets[0].sellingPrice)
            assert.strictEqual(bobTickets[0].forSale, false, "ticket is not for sale anymore")
        })
    })
});
