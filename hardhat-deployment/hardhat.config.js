require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: { 
    // Add your network configuration here 
    poa: { 
      url: process.env.RPC_URL, // RPC URL of your network 
      chainId: parseInt(process.env.CHAIN_ID), // Chain ID of your network 
      accounts: [process.env.PRIVATE_KEY], // Array of private keys to use this network 
    }, 
  },
};
