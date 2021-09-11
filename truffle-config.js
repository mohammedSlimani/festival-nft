const path = require("path");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "abi"),
  networks: {
    development: {
      host: "ganache", // same name as in the docker-compose
      port: 8545,
      network_id: "*",
    }
  },
  compilers: {
    solc: {
      version: "^0.8.0"
    }
  }
};
