import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ignition-viem";
import "hardhat-abi-exporter";
import type { AbiExporterUserConfig } from "hardhat-abi-exporter";
import { vars } from "hardhat/config";

const alchemyKey = vars.has("ALCHEMY_KEY") ? vars.get("ALCHEMY_KEY") : "";
const walletKey = vars.has("WALLET_KEY") ? [vars.get("WALLET_KEY")] : [];
const etherscanKeyOptimism = vars.has("ETHERSCAN_KEY_OPTIMISM")
  ? vars.get("ETHERSCAN_KEY_OPTIMISM")
  : "";
const etherscanKeyBase = vars.has("ETHERSCAN_KEY_BASE")
  ? vars.get("ETHERSCAN_KEY_BASE")
  : "";

const config: HardhatUserConfig & { abiExporter: AbiExporterUserConfig } = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
  networks: {
    hardhat: {},
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      accounts: walletKey,
    },
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`,
      accounts: walletKey,
    },
  },
  ignition: {
    strategyConfig: {
      create2: {
        // To learn more about salts, see the CreateX documentation
        salt: "0x0000000000000000000000000000000000000000000000000000000000000002",
      },
    },
  },
  etherscan: {
    apiKey: {
      optimisticEthereum: etherscanKeyOptimism,
      base: etherscanKeyBase,
    },
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
