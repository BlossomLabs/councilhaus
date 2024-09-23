import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "hardhat-abi-exporter";
import { vars } from "hardhat/config";

const alchemyKey = vars.has("ALCHEMY_KEY") ? vars.get("ALCHEMY_KEY") : "";
const walletKey = vars.has("WALLET_KEY") ? [vars.get("WALLET_KEY")] : [];
const etherscanKey = vars.has("ETHERSCAN_KEY") ? vars.get("ETHERSCAN_KEY") : "";

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
    hardhat: {},
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      accounts: walletKey,
    },
  },
  etherscan: {
    apiKey: etherscanKey,
  },
  sourcify: {
    enabled: false,
  },
  abiExporter: {
    path: "./subgraph/abis",
    runOnCompile: true,
    clear: true,
    flat: true,
  },
};

export default config;
