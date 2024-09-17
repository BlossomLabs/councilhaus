import { viem } from "hardhat";
import { parseEventLogs } from "viem";

async function main() {
  const publicClient = await viem.getPublicClient();

  const councilFactory = await viem.getContractAt(
    "CouncilFactory",
    "0x4f875b97cf4edb0d1d561a3d1926ed6663df08b2",
  );

  const hash = await councilFactory.write.createCouncil([
    {
      councilName: "Spacing Guild",
      councilSymbol: "SPA",
      councilMembers: [
        {
          account: "0x0992b9c6eA15A09418fF454a436705aE29877D88",
          votingPower: 100n,
        },
        {
          account: "0xf632ce27ea72dea30d30c1a9700b6b3bceaa05cf",
          votingPower: 100n,
        },
        {
          account: "0xbaD8bcc9Eb5749829cF12189fDD5c1230D6C85e8",
          votingPower: 100n,
        },
      ],
      grantees: [
        {
          name: "ENS Wayback Machine",
          account: "0x6ea869B6870dd98552B0C7e47dA90702a436358b",
        },
        {
          name: "Giveth House",
          account: "0xB6989F472Bef8931e6Ca882b1f875539b7D5DA19",
        },
        {
          name: "EVMcrispr",
          account: "0xeafFF6dB1965886348657E79195EB6f1A84657eB",
        },
      ],
      distributionToken: "0x7d342726b69c28d942ad8bfe6ac81b972349d524", // DAIx
    },
  ]);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  });

  const logs = parseEventLogs({
    abi: councilFactory.abi,
    logs: receipt.logs,
  });

  // Type guard to check if log.args has the expected shape
  function isCouncilCreatedArgs(
    args: any,
  ): args is { council: `0x${string}`; pool: `0x${string}` } {
    return (
      args && typeof args.council === "string" && typeof args.pool === "string"
    );
  }

  logs
    .filter((log) => log.eventName === "CouncilCreated")
    .map((log) => log.args)
    .filter(isCouncilCreatedArgs)
    .map(
      ({ council, pool }) => `Council deployed to ${council} with pool ${pool}`,
    )
    .map((s) => console.log(s));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
