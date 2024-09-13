import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { assert, expect } from "chai";
import { viem } from "hardhat";
import { getAddress, parseEventLogs, parseUnits } from "viem";

// A deployment function to set up the initial state
const deploy = async () => {
  const publicClient = await viem.getPublicClient();
  const [wallet1, wallet2] = await viem.getWalletClients();

  const gdav1Forwarder = await viem.deployContract("GDAv1ForwarderMock");

  const councilFactory = await viem.deployContract("CouncilFactory", [
    gdav1Forwarder.address,
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
    gdav1Forwarder,
  };
};

describe("CouncilFactory Contract Tests", () => {
  describe("Deployment", () => {
    it("should set the correct GDAv1Forwarder address", async () => {
      const { councilFactory, gdav1Forwarder } = await loadFixture(deploy);
      assert.equal(
        await councilFactory.read.gdav1Forwarder(),
        getAddress(gdav1Forwarder.address),
      );
    });

    it("should revert if GDAv1Forwarder address is not a contract", async () => {
      await expect(
        viem.deployContract("CouncilFactory", [
          "0x000000000000000000000000000000000000dead",
        ]),
      ).to.be.rejected;
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
          { account: addr1, votingPower: 500000n },
          { account: addr2, votingPower: 1000000n },
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
