# Councilhaus Contracts

In order to deploy the contracts, you need to set the following variables:

```shell
npx hardhat vars set ALCHEMY_KEY
npx hardhat vars set WALLET_KEY
npx hardhat run scripts/deploy.ts
```

In order to verify the contracts, you need to set the following variables:

```shell
npx hardhat vars set ETHERSCAN_KEY
npx hardhat verify --network <network> <factoryAddress> 0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08
npx hardhat verify --network <network> <councilAddress> "Spacing Guild" "SPA" 0x7d342726b69c28d942ad8bfe6ac81b972349d524 0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08
```
