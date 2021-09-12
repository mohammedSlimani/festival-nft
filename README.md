# festival-nft
Sell and buy tickets of a festival using ERC721 and ERC20

## Introduction
This is an implementation to a distributed system of a festival. The organizer can create a festival with a maximum
number of tickets. Users can buy tickets and sell them for no more than 110% of the previous price

## Technologies
- Truffle
- Ganache
- React

## Blockchain layer:
- `TicketNFT`: Holds most of the business logic. It is the ERC721 token
- `TicketCoin`: the ERC20 token
- `TicketFactory`: wrapper of the ERC721 and ERC20 tokens. Holds payment logic
- `Festival`: Main entry to the contracts.

## FrontEnd layer:
(unimplemented)

# Run tests
you can run the truffle service separately (with its dependency ganache) using the command
```
docker-compose --use-aliases --service-ports --entrypoints=/bin/bash truffle
```
then once you are in the bash of the truffle service run
```
npm test
```

# Run locally
it is as easy as 
```
docker-compose up
```
the front end would be in the `http://localhost:3000`, unfortunately it is incomplete. Would have been neat if I could 
have learned web3 in time and implemented the interfaces.

# Known issues:
- No FrontEnd 
- Need better handling of decimals
- If ticket price is one, it cant be sold in any other price than 1
- minting is expensive the way it is implemented now. Possible solution: mint only before buying from organizer.
