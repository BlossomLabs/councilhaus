import { viem } from "hardhat";
import { assert, expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { parseUnits, parseEventLogs } from "viem";

// A deployment function to set up the initial state
const deploy = async () => {

  const publicClient = await viem.getPublicClient()
  const [wallet1, wallet2] = await viem.getWalletClients()

  const councilFactory = await viem.deployContract("CouncilFactory", ["0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08"]);

  const councilFromTx = async (hash: `0x${string}`) => {
    const receipt = await publicClient.getTransactionReceipt({ hash })
    const logs = parseEventLogs({ abi: councilFactory.abi, logs: receipt.logs })
    return logs[0].args
  }

  return {
    councilFactory,
    publicClient,
    wallet1,
    wallet2,
    addr1: wallet1.account.address,
    addr2: wallet2.account.address,
    councilFromTx
  };
};

describe("CouncilFactory Contract Tests", function () {
  describe("Deployment", function () {
    it("should set the correct GDAv1Forwarder address", async function () {
      const { councilFactory } = await loadFixture(deploy);
      assert.equal(await councilFactory.read.gdav1Forwarder(), "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08");
    });

    it("should revert if GDAv1Forwarder address is not a contract", async function () {
      await expect(viem.deployContract("CouncilFactory", ["0x000000000000000000000000000000000000dead"])).to.be.rejected;
    });
  });
  describe("createCouncil", function () {
    it("should create a new council and emit a CouncilCreated event", async function () {
      const { councilFactory, addr1, addr2, councilFromTx } = await loadFixture(deploy);
      const config = {
        councilName: "Spacing Guild",
        councilSymbol: "SPA",
        councilMembers: [
          { account: addr1, votingPower: parseUnits("100", 18) },
          { account: addr2, votingPower: parseUnits("200", 18) }
        ],
        grantees: [
          { name: "ENS Wayback Machine", account: "0x6ea869B6870dd98552B0C7e47dA90702a436358b" as `0x${string}` },
          { name: "Giveth House", account: "0xB6989F472Bef8931e6Ca882b1f875539b7D5DA19" as `0x${string}` },
          { name: "EVMcrispr", account: "0xeafFF6dB1965886348657E79195EB6f1A84657eB" as `0x${string}` }
        ],
        quorum: parseUnits("0.5", 18),
        distributionToken: "0x7d342726b69c28d942ad8bfe6ac81b972349d524" as `0x${string}`, // DAIx
        flowRate: parseUnits("1", 18) / 24n / 60n / 60n // 1 DAI per day
      };

      const hash = await councilFactory.write.createCouncil([config])
    
      const { council, pool } = await councilFromTx(hash)
      expect(council).to.be.a('string');
      expect(pool).to.be.a('string');
    });
  });
});
