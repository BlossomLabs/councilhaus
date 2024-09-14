import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre, { viem } from "hardhat";
import { parseEventLogs } from "viem";

// A deployment function to set up the initial state
const deploy = async () => {
  const publicClient = await viem.getPublicClient();
  const [wallet1, wallet2, wallet3] = await viem.getWalletClients();
  const accounts = [wallet1.account, wallet2.account, wallet3.account];

  const gdav1ForwarderAddress: `0x${string}` =
    "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08";

  // Deploy the CouncilFactory contract
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

  // Prepare initial configuration
  const config = {
    councilName: "Spacing Guild",
    councilSymbol: "SPA",
    councilMembers: [
      { account: accounts[0].address, votingPower: 50n },
      { account: accounts[1].address, votingPower: 100n },
    ],
    grantees: [
      {
        name: "ENS Wayback Machine",
        account: "0x6ea869B6870dd98552B0C7e47dA90702a436358b" as `0x${string}`,
      },
      {
        name: "Giveth House",
        account: "0xB6989F472Bef8931e6Ca882b1f875539b7D5DA19" as `0x${string}`,
      },
      {
        name: "EVMcrispr",
        account: "0xeafFF6dB1965886348657E79195EB6f1A84657eB" as `0x${string}`,
      },
    ],
    distributionToken:
      "0x7d342726b69c28d942ad8bfe6ac81b972349d524" as `0x${string}`, // DAIx
  };

  // Create a new council
  const hash = await councilFactory.write.createCouncil([config]);

  const { council, pool } = await councilFromTx(hash);

  // Get the deployed Council contract
  const councilContract = await viem.getContractAt("Council", council);

  // Get the deployed Pool contract
  const poolContract = await viem.getContractAt("ISuperfluidPool", pool);

  return {
    councilFactory,
    councilContract,
    poolContract,
    publicClient,
    wallet1,
    wallet2,
    accounts,
    councilFromTx,
    gdav1ForwarderAddress,
    config,
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

  describe("Council and Pool Interactions", () => {
    it("should allow council members to allocate units to grantees", async () => {
      const { councilContract, poolContract, config, wallet1, wallet2 } =
        await loadFixture(deploy);

      // Council member 1 allocates 30 units to grantee 1 and 20 units to grantee 2
      const allocation1 = {
        accounts: [
          config.grantees[0].account,
          config.grantees[1].account,
        ] as `0x${string}`[],
        amounts: [30n, 20n],
      };

      // Council member 2 allocates 50 units to grantee 2 and 50 units to grantee 3
      const allocation2 = {
        accounts: [
          config.grantees[1].account,
          config.grantees[2].account,
        ] as `0x${string}`[],
        amounts: [50n, 50n],
      };

      // Council member 1 allocates budget
      await councilContract.write.allocateBudget([allocation1], {
        account: wallet1.account.address,
      });

      // Council member 2 allocates budget
      await councilContract.write.allocateBudget([allocation2], {
        account: wallet2.account.address,
      });

      // Check the total allocated units in the pool
      const totalUnits = await poolContract.read.getTotalUnits();
      expect(totalUnits).to.equal(200n);

      // Check units per grantee
      const unitsGrantee1 = await poolContract.read.getUnits([
        config.grantees[0].account,
      ]);
      const unitsGrantee2 = await poolContract.read.getUnits([
        config.grantees[1].account,
      ]);
      const unitsGrantee3 = await poolContract.read.getUnits([
        config.grantees[2].account,
      ]);

      expect(unitsGrantee1).to.equal(30n);
      expect(unitsGrantee2).to.equal(70n); // 20 from member1 + 50 from member2
      expect(unitsGrantee3).to.equal(50n);
    });

    it("should update units when council members change their allocations", async () => {
      const { councilContract, poolContract, config, wallet1, wallet2 } =
        await loadFixture(deploy);

      // Initial allocations (same as previous test)
      const initialAllocation1 = {
        accounts: [
          config.grantees[0].account,
          config.grantees[1].account,
        ] as `0x${string}`[],
        amounts: [30n, 20n],
      };
      const initialAllocation2 = {
        accounts: [
          config.grantees[1].account,
          config.grantees[2].account,
        ] as `0x${string}`[],
        amounts: [50n, 50n],
      };

      // Members allocate initial budgets
      await councilContract.write.allocateBudget([initialAllocation1], {
        account: wallet1.account.address,
      });
      await councilContract.write.allocateBudget([initialAllocation2], {
        account: wallet2.account.address,
      });

      // Council member 1 changes allocation to give all 50 units to grantee 3
      const newAllocation1 = {
        accounts: [config.grantees[2].account] as `0x${string}`[],
        amounts: [50n],
      };
      await councilContract.write.allocateBudget([newAllocation1], {
        account: wallet1.account.address,
      });

      // Check units per grantee after reallocation
      const unitsGrantee1 = await poolContract.read.getUnits([
        config.grantees[0].account,
      ]);
      const unitsGrantee2 = await poolContract.read.getUnits([
        config.grantees[1].account,
      ]);
      const unitsGrantee3 = await poolContract.read.getUnits([
        config.grantees[2].account,
      ]);

      expect(unitsGrantee1).to.equal(0n); // Member1 removed allocation
      expect(unitsGrantee2).to.equal(50n); // Only from member2 now
      expect(unitsGrantee3).to.equal(100n); // 50 from member1 + 50 from member2

      // Check the total allocated units in the pool
      const totalUnits = await poolContract.read.getTotalUnits();
      expect(totalUnits).to.equal(150n);
    });

    it("should update units when a grantee is removed and re-added", async () => {
      const {
        councilContract,
        poolContract,
        accounts,
        config,
        wallet1,
        wallet2,
      } = await loadFixture(deploy);

      // Members allocate budgets
      const allocation1 = {
        accounts: [
          config.grantees[0].account,
          config.grantees[1].account,
        ] as `0x${string}`[],
        amounts: [30n, 20n],
      };
      await councilContract.write.allocateBudget([allocation1], {
        account: wallet1.account.address,
      });

      // Remove grantee 1
      await councilContract.write.removeGrantee([config.grantees[0].account]);

      // Check units after grantee removal
      const unitsGrantee1AfterRemoval = await poolContract.read.getUnits([
        config.grantees[0].account,
      ]);
      expect(unitsGrantee1AfterRemoval).to.equal(0n);

      // Re-add grantee 1
      await councilContract.write.addGrantee([
        config.grantees[0].name,
        config.grantees[0].account,
      ]);

      // Grantee 1 should have 0 units because the old allocation is not applied to the new grantee ID
      const unitsGrantee1AfterReAdd = await poolContract.read.getUnits([
        config.grantees[0].account,
      ]);
      expect(unitsGrantee1AfterReAdd).to.equal(0n);

      // Council member 1 re-allocates units to grantee 1
      const newAllocation1 = {
        accounts: [config.grantees[0].account],
        amounts: [50n],
      };
      await councilContract.write.allocateBudget([newAllocation1], {
        account: wallet1.account.address,
      });

      // Now grantee 1 should have units again
      const unitsGrantee1Final = await poolContract.read.getUnits([
        config.grantees[0].account,
      ]);
      expect(unitsGrantee1Final).to.equal(50n);
    });

    it("should update units when a council member is removed", async () => {
      const {
        councilContract,
        poolContract,
        accounts,
        config,
        wallet1,
        wallet2,
      } = await loadFixture(deploy);

      // Members allocate budgets
      const allocation1 = {
        accounts: [config.grantees[0].account],
        amounts: [50n],
      };
      const allocation2 = {
        accounts: [config.grantees[1].account],
        amounts: [100n],
      };
      await councilContract.write.allocateBudget([allocation1], {
        account: wallet1.account.address,
      });
      await councilContract.write.allocateBudget([allocation2], {
        account: wallet2.account.address,
      });

      // Check initial units
      const unitsGrantee1 = await poolContract.read.getUnits([
        config.grantees[0].account,
      ]);
      const unitsGrantee2 = await poolContract.read.getUnits([
        config.grantees[1].account,
      ]);
      expect(unitsGrantee1).to.equal(50n);
      expect(unitsGrantee2).to.equal(100n);

      // Remove council member 1
      await councilContract.write.removeCouncilMember([accounts[0].address]);

      // Grantee 1's units should now be 0
      const unitsGrantee1AfterRemoval = await poolContract.read.getUnits([
        config.grantees[0].account,
      ]);
      expect(unitsGrantee1AfterRemoval).to.equal(0n);

      // Grantee 2's units should remain unchanged
      const unitsGrantee2AfterRemoval = await poolContract.read.getUnits([
        config.grantees[1].account,
      ]);
      expect(unitsGrantee2AfterRemoval).to.equal(100n);
    });
  });
});
