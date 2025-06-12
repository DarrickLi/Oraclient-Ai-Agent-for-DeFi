require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/env-enc").config();
require("hardhat-deploy");
require("@nomicfoundation/hardhat-verify");
require("./tasks");

const SEPOLIA_URL = process.env.SEPOLIA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API = process.env.ETHSCAN_API;
const PRIVATE_KEY2 = process.env.PRIVATE_KEY2;


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks:{
    sepolia:{
      url:SEPOLIA_URL,
      accounts:[PRIVATE_KEY , PRIVATE_KEY2],
      chainId:11155111,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API,
  },
  namedAccounts:{
    firstAccount:{
      default:0,
    },
    secondAccount:{
      default:1,
    },
  },
};
