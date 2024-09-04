import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

if (!process.env.ALCHEMY_KEY) {
  throw new Error("ALCHEMY_KEY is required");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  networks: {
    'hardhat': {
      forking: {
        url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
        blockNumber: 124897000
      }
    },
    'optimism': {
      url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      accounts: process.env.WALLET_KEY ? [process.env.WALLET_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
     "optimism": process.env.BLOCKSCOUT_KEY as string,
    },
    customChains: [
      {
        network: "optimism",
        chainId: 10,
        urls: {
         apiURL: "https://optimism.blockscout.com/api",
         browserURL: "https://optimism.blockscout.com"
        }
      },
    ]
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
