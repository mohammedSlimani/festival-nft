FROM node:14

WORKDIR /home/app

COPY . .

RUN npm install

RUN npm install -g mocha
RUN npm install -g truffle
RUN truffle compile

ENTRYPOINT truffle migrate
