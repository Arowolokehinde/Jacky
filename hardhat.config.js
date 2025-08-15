import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-verify';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "mantleSepolia",
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainId: 31337,
    },
    mantle: {
      type: "http",
      url: "https://rpc.mantle.xyz", // mainnet
      accounts: [process.env.ACCOUNT_PRIVATE_KEY ?? ""],
    },
    mantleSepolia: {
      type: "http",
      url: "https://rpc.sepolia.mantle.xyz", // Sepolia Testnet
      accounts: [process.env.ACCOUNT_PRIVATE_KEY ?? ""],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: process.env.API_KEY,
    customChains: [
      {
        network: "mantle",
        chainId: 5000,
        urls: {
          apiURL: "https://api.mantlescan.xyz/api",
          browserURL: "https://mantlescan.xyz",
        },
      },
      {
        network: "mantleSepolia",
        chainId: 5003,
        urls: {
          apiURL: "https://api-sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz/",
        },
      },
    ],
  },
};