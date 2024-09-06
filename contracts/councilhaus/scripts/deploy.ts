import { viem, run } from "hardhat";
import { parseEventLogs, parseUnits } from 'viem'

async function deployAndVerify(contractName: string, args: any[]) {
  const contract = await viem.deployContract(contractName, args);
  if (process.env.BLOCKSCOUT_KEY) {
    try {
      await Promise.race([
        run("verify:verify", {
          address: contract.address,
          constructorArguments: args
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Verification timed out')), 20000))
      ]);
    } catch(e: any) {
      if (e.name === 'ContractAlreadyVerifiedError') {
        console.log(`Contract ${contractName} already verified`)
      } else {
        console.error(e);
      }
    }
  }
  return contract;
}

async function main() {
  const publicClient = await viem.getPublicClient()
  const [wallet] = await viem.getWalletClients()

  const councilFactory = await deployAndVerify("CouncilFactory", ["0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08"]);

  console.log(`CouncilFactory deployed to ${councilFactory.address}`);

  const hash = await councilFactory.write.createCouncil([
    {
      councilName: "Spacing Guild",
      councilSymbol: "SPA",
      councilMembers: [
        [wallet.account.address, parseUnits("100", 18)],
        ["0xf632ce27ea72dea30d30c1a9700b6b3bceaa05cf", parseUnits("200", 18)]
      ],
      grantees: [
        ["ENS Wayback Machine", "0x6ea869B6870dd98552B0C7e47dA90702a436358b"],
        ["Giveth House", "0xB6989F472Bef8931e6Ca882b1f875539b7D5DA19"],
        ["EVMcrispr", "0xeafFF6dB1965886348657E79195EB6f1A84657eB"]
      ],
      distributionToken: "0x7d342726b69c28d942ad8bfe6ac81b972349d524", // DAIx
    }
  ]);

  const receipt = await publicClient.getTransactionReceipt({
    hash
  })

  const logs = parseEventLogs({ 
    abi: councilFactory.abi, 
    logs: receipt.logs,
  })

  // Type guard to check if log.args has the expected shape
  function isCouncilCreatedArgs(args: any): args is { council: `0x${string}`, pool: `0x${string}` } {
    return args && typeof args.council === 'string' && typeof args.pool === 'string';
  }

  logs
    .filter(log => log.eventName === 'CouncilCreated')
    .map(log => log.args)
    .filter(isCouncilCreatedArgs)
    .map(({ council, pool }) => `Council deployed to ${council} with pool ${pool}`)
    .forEach(s => console.log(s))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
