import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { assert, expect } from "chai";
import hre, { viem } from "hardhat";
import { getAddress, parseEventLogs } from "viem";

// A deployment function to set up the initial state
const deploy = async () => {
  const publicClient = await viem.getPublicClient();
  const [wallet1, wallet2] = await viem.getWalletClients();

  const gdav1ForwarderAddress: `0x${string}` =
    "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08";

  const councilFactory = await viem.deployContract("CouncilFactory", [
    gdav1ForwarderAddress,
  ]);

  const councilFromTx = async (hash: `0x${string}`) => {
    const receipt = await publicClient.getTransactionReceipt({ hash });
    const logs = parseEventLogs({
      abi: councilFactory.abi,
      logs: receipt.logs,
    });
    return logs[0].args;
  };

  return {
    councilFactory,
    publicClient,
    wallet1,
    wallet2,
    addr1: wallet1.account.address,
    addr2: wallet2.account.address,
    councilFromTx,
    gdav1ForwarderAddress,
  };
};

describe("Integration Tests: Pools", () => {
  before(async () => {
    if (!process.env.ALCHEMY_KEY) {
      throw new Error("ALCHEMY_KEY is not set");
    }
    // Switch to the forked network
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
            blockNumber: 125_042_537,
          },
        },
      ],
    });
  });
  describe("Deployment", () => {
    it("should set the correct GDAv1Forwarder address", async () => {
      const { councilFactory, gdav1ForwarderAddress } =
        await loadFixture(deploy);
      assert.equal(
        await councilFactory.read.gdav1Forwarder(),
        getAddress(gdav1ForwarderAddress),
      );
    });
  });
  describe("createCouncil", () => {
    it("should create a new council and emit a CouncilCreated event", async () => {
      const { councilFactory, addr1, addr2, councilFromTx } =
        await loadFixture(deploy);
      const config = {
        councilName: "Spacing Guild",
        councilSymbol: "SPA",
        councilMembers: [
          { account: addr1, votingPower: 50n },
          { account: addr2, votingPower: 100n },
        ],
        grantees: [
          {
            name: "ENS Wayback Machine",
            account:
              "0x6ea869B6870dd98552B0C7e47dA90702a436358b" as `0x${string}`,
          },
          {
            name: "Giveth House",
            account:
              "0xB6989F472Bef8931e6Ca882b1f875539b7D5DA19" as `0x${string}`,
          },
          {
            name: "EVMcrispr",
            account:
              "0xeafFF6dB1965886348657E79195EB6f1A84657eB" as `0x${string}`,
          },
        ],
        distributionToken:
          "0x7d342726b69c28d942ad8bfe6ac81b972349d524" as `0x${string}`, // DAIx
      };

      const hash = await councilFactory.write.createCouncil([config]);

      const { council, pool } = await councilFromTx(hash);
      expect(council).to.be.a("string");
      expect(pool).to.be.a("string");
    });
  });
});
