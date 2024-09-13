import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { viem } from "hardhat";
import { getAddress, parseUnits, zeroAddress } from "viem";
import { expectEvent } from "../utils";

const ethxTokenAddress = "0x4ac8bD1bDaE47beeF2D1c6Aa62229509b962Aa0d";

// A deployment function to set up the initial state
const deploy = async () => {
  const publicClient = await viem.getPublicClient();
  const [wallet1, wallet2] = await viem.getWalletClients();

  const gdav1Forwarder = await viem.deployContract("GDAv1ForwarderMock");

  const council = await viem.deployContract("Council", [
    "Spacing Guild",
    "SPA",
    ethxTokenAddress,
    gdav1Forwarder.address,
  ]);

  const pool = await viem.getContractAt(
    "ISuperfluidPool",
    await council.read.pool(),
  );

  return {
    council,
    pool,
    publicClient,
    wallet1,
    wallet2,
    addr1: wallet1.account.address,
    addr2: wallet2.account.address,
    gdav1Forwarder,
  };
};

describe("Council Contract Tests", () => {
  describe("Deployment", () => {
    it("should deploy with the correct initial parameters", async () => {
      const { council, gdav1Forwarder } = await loadFixture(deploy);
      expect(await council.read.name()).to.equal("Spacing Guild");
      expect(await council.read.symbol()).to.equal("SPA");
      expect(await council.read.distributionToken()).to.equal(ethxTokenAddress);
      expect(await council.read.gdav1Forwarder()).to.equal(
        getAddress(gdav1Forwarder.address),
      );
      expect(await council.read.maxAllocationsPerMember()).to.equal(10);
    });
    it("should revert if the pool cannot be created", async () => {
      const { gdav1Forwarder } = await loadFixture(deploy);
      await expect(
        viem.deployContract("Council", [
          "Spacing Guild",
          "SPA",
          zeroAddress,
          gdav1Forwarder.address,
        ]),
      ).to.be.rejected;
    });
  });

  describe("Non-Transferable Token Tests with zero decimals", () => {
    it("should revert on token transfer", async () => {
      const { council, addr1, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);

      await expect(
        council.write.transfer([addr2, 50n], { account: addr1 }),
      ).to.be.rejectedWith("CantTransferToken");
    });

    it("should revert on token transferFrom", async () => {
      const { council, addr1, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);

      await expect(
        council.write.transferFrom([addr1, addr2, 50n], { account: addr2 }),
      ).to.be.rejectedWith("CantTransferToken");
    });

    it("should revert on token approval", async () => {
      const { council, addr1, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);

      await expect(
        council.write.approve([addr2, 50n], { account: addr1 }),
      ).to.be.rejectedWith("CantApproveToken");
    });

    it("should return the correct decimals", async () => {
      const { council } = await loadFixture(deploy);
      expect(await council.read.decimals()).to.equal(0);
    });
  });

  describe("Role Management", () => {
    it("Should only allow admins to manage roles", async () => {
      const { council, addr2 } = await loadFixture(deploy);

      await expect(
        council.write.grantRole(
          [await council.read.MEMBER_MANAGER_ROLE(), addr2],
          {
            account: addr2,
          },
        ),
      ).to.be.rejectedWith("AccessControlUnauthorizedAccount");
      await council.write.grantRole([
        await council.read.MEMBER_MANAGER_ROLE(),
        addr2,
      ]);
      expect(
        await council.read.hasRole([
          await council.read.MEMBER_MANAGER_ROLE(),
          addr2,
        ]),
      ).to.be.true;
    });
  });

  describe("Council Member Management", async () => {
    it("Should allow MEMBER_MANAGER_ROLE to add council members", async () => {
      const { council, addr2, publicClient } = await loadFixture(deploy);
      await council.write.grantRole([
        await council.read.MEMBER_MANAGER_ROLE(),
        addr2,
      ]);
      const tx = await council.write.addCouncilMember([addr2, 100n], {
        account: addr2,
      });
      expect(await council.read.balanceOf([addr2])).to.equal(100n);
      await expectEvent(
        tx,
        publicClient,
        "CouncilMemberAdded(address member, uint256 votingPower)",
        {
          member: getAddress(addr2),
          votingPower: 100n,
        },
      );
    });

    it("Should allow MEMBER_MANAGER_ROLE to remove council members", async () => {
      const { council, addr1, addr2, publicClient } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);
      await council.write.addGrantee(["Grantee", addr2]);
      const tx = await council.write.removeCouncilMember([addr1]);
      await expectEvent(
        tx,
        publicClient,
        "CouncilMemberRemoved(address member)",
        {
          member: getAddress(addr1),
        },
      );
    });

    it("Should remove a council member allocation when the council member is removed", async () => {
      const { council, pool, addr1 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);
      await council.write.addGrantee(["Grantee", addr1]);
      await council.write.allocateBudget([
        { accounts: [addr1], amounts: [50n] },
      ]);
      expect(await council.read.getAllocation([addr1])).to.be.deep.equal([
        { accounts: [getAddress(addr1)], amounts: [50n] },
        50n,
        100n,
      ]);
      expect(await pool.read.getUnits([addr1])).to.equal(50n);
      expect(await council.read.totalAllocated()).to.equal(50n);
      await council.write.removeCouncilMember([addr1]);
      expect(await council.read.getAllocation([addr1])).to.be.deep.equal([
        { accounts: [], amounts: [] },
        0n,
        0n,
      ]);
      expect(await pool.read.getUnits([addr1])).to.equal(0n);
      expect(await council.read.totalAllocated()).to.equal(0n);
    });

    it("Should revert if adding a council member that already exists", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr2, 100n]);
      await expect(
        council.write.addCouncilMember([addr2, 100n]),
      ).to.be.rejectedWith("CouncilMemberAlreadyAdded");
    });

    it("Should revert if removing a non-existent council member", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      await expect(
        council.write.removeCouncilMember([addr2]),
      ).to.be.rejectedWith("CouncilMemberNotFound");
    });

    it("Should revert if adding a council member with zero voting power", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      await expect(
        council.write.addCouncilMember([addr2, 0n]),
      ).to.be.rejectedWith("AmountMustBeGreaterThanZero");
    });

    it("Should revert if adding a council member with a voting power greater than 1M", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      await expect(
        council.write.addCouncilMember([addr2, 1000001n]),
      ).to.be.rejectedWith("VotingPowerTooHigh");
    });

    it("Should revert if adding or removing a council member from a non-MEMBER_MANAGER_ROLE", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      await expect(
        council.write.addCouncilMember([addr2, 100n], {
          account: addr2,
        }),
      ).to.be.rejectedWith("AccessControlUnauthorizedAccount");
      await council.write.addCouncilMember([addr2, 100n]);
      await expect(
        council.write.removeCouncilMember([addr2], {
          account: addr2,
        }),
      ).to.be.rejectedWith("AccessControlUnauthorizedAccount");
    });
  });

  describe("Max Allocations Per Member", () => {
    it("Should allow the admin to set the max allocations per member", async () => {
      const { council, publicClient } = await loadFixture(deploy);
      const tx = await council.write.setMaxAllocationsPerMember([10]);
      expect(await council.read.maxAllocationsPerMember()).to.equal(10);
      await expectEvent(
        tx,
        publicClient,
        "MaxAllocationsPerMemberSet(uint8 maxAllocationsPerMember)",
        {
          maxAllocationsPerMember: 10,
        },
      );
    });

    it("Should revert if the max allocations per member is set to 0", async () => {
      const { council } = await loadFixture(deploy);
      await expect(
        council.write.setMaxAllocationsPerMember([0]),
      ).to.be.rejectedWith("InvalidMaxAllocations");
    });

    it("Should revert if the max allocations per member is set to a value greater than MAX_ALLOCATIONS_PER_MEMBER", async () => {
      const { council } = await loadFixture(deploy);
      await expect(
        council.write.setMaxAllocationsPerMember([100]),
      ).to.be.rejectedWith("InvalidMaxAllocations");
    });

    it("Should revert if the max allocations per member is set by a non-admin", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      await expect(
        council.write.setMaxAllocationsPerMember([10], {
          account: addr2,
        }),
      ).to.be.rejectedWith("AccessControlUnauthorizedAccount");
    });
  });

  describe("Grantee Management", () => {
    it("Should allow GRANTEE_MANAGER_ROLE to add and remove grantees", async () => {
      const { council, addr2, publicClient } = await loadFixture(deploy);
      await council.write.grantRole([
        await council.read.GRANTEE_MANAGER_ROLE(),
        addr2,
      ]);
      const tx = await council.write.addGrantee(["Grantee", addr2], {
        account: addr2,
      });
      expect(await council.read.isGrantee([addr2])).to.be.true;
      await expectEvent(
        tx,
        publicClient,
        "GranteeAdded(string name, address grantee)",
        {
          name: "Grantee",
          grantee: getAddress(addr2),
        },
      );
      const tx2 = await council.write.removeGrantee([addr2], {
        account: addr2,
      });
      expect(await council.read.isGrantee([addr2])).to.be.false;
      await expectEvent(tx2, publicClient, "GranteeRemoved(address grantee)", {
        grantee: getAddress(addr2),
      });
    });

    it("Should remove a grantee allocation when the grantee is removed", async () => {
      const { council, pool, addr1, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);
      await council.write.addGrantee(["Grantee", addr2]);
      await council.write.allocateBudget([
        { accounts: [addr2], amounts: [50n] },
      ]);
      await council.write.removeGrantee([addr2]);
      expect(await council.read.getAllocation([addr1])).to.be.deep.equal([
        { accounts: [], amounts: [] },
        0n,
        100n,
      ]);
      expect(await council.read.isGrantee([addr2])).to.be.false;
      expect(await pool.read.getUnits([addr2])).to.equal(0n);
      expect(await council.read.totalAllocated()).to.equal(0n);
    });

    it("Should revert if adding / removing a grantee from a non-GRANTEE_MANAGER_ROLE", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      await expect(
        council.write.addGrantee(["Grantee", addr2], {
          account: addr2,
        }),
      ).to.be.rejectedWith("AccessControlUnauthorizedAccount");
      await council.write.addGrantee(["Grantee", addr2]);
      await expect(
        council.write.removeGrantee([addr2], {
          account: addr2,
        }),
      ).to.be.rejectedWith("AccessControlUnauthorizedAccount");
    });

    it("Should revert if adding a grantee that already exists", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      await council.write.addGrantee(["Grantee", addr2]);
      await expect(
        council.write.addGrantee(["Grantee", addr2]),
      ).to.be.rejectedWith("GranteeAlreadyAdded");
    });

    it("Should revert if removing a non-existent grantee", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      await expect(council.write.removeGrantee([addr2])).to.be.rejectedWith(
        "GranteeNotFound",
      );
    });
  });

  describe("Budget Allocation", () => {
    it("Should allow council members to allocate budget", async () => {
      const { council, addr1, addr2, publicClient } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);
      await council.write.addGrantee(["Grantee", addr2]);

      const allocation = { accounts: [addr2], amounts: [50n] };
      const tx = await council.write.allocateBudget([allocation]);
      const [allocationResult, totalAllocated, balance] =
        await council.read.getAllocation([addr1]);
      expect(allocationResult.accounts[0].toLowerCase()).to.equal(addr2);
      expect(allocationResult.amounts[0]).to.equal(50n);
      expect(totalAllocated).to.equal(50n);
      expect(balance).to.equal(100n);
      await expectEvent(
        tx,
        publicClient,
        "BudgetAllocated(address member, (address[],uint128[]) allocation)",
        {
          member: getAddress(addr1),
          allocation: [allocation.accounts.map(getAddress), allocation.amounts],
        },
      );
    });

    it("Should revert if non-council members allocate budget", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      const allocation = { accounts: [addr2], amounts: [50n] };
      await expect(
        council.write.allocateBudget([allocation], {
          account: addr2,
        }),
      ).to.be.rejectedWith("CouncilMemberNotFound");
    });

    it("Should revert if allocation exceeds max allocations per member", async () => {
      const { council, addr1, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr2, 100n]);
      await council.write.addGrantee(["Grantee", addr1]);
      await council.write.addGrantee(["Grantee", addr2]);
      await council.write.setMaxAllocationsPerMember([1]);

      const allocation = { accounts: [addr1, addr2], amounts: [50n, 50n] };
      await expect(
        council.write.allocateBudget([allocation], {
          account: addr2,
        }),
      ).to.be.rejectedWith("TooManyAllocations");
    });

    it("Should revert if arrays are of different lengths", async () => {
      const { council, addr1, addr2 } = await loadFixture(deploy);

      await council.write.addCouncilMember([addr2, 100n]);

      const allocation = { accounts: [addr1, addr2], amounts: [50n] };
      await expect(
        council.write.allocateBudget([allocation], {
          account: addr2,
        }),
      ).to.be.rejectedWith("ArraysLengthMismatch");
    });

    it("Should revert if non-grantees are allocated", async () => {
      const { council, addr1, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr2, 100n]);
      await council.write.addGrantee(["Grantee", addr1]);

      const allocation = { accounts: [addr1, addr2], amounts: [50n, 50n] };
      await expect(
        council.write.allocateBudget([allocation], {
          account: addr2,
        }),
      ).to.be.rejectedWith("GranteeNotFound");
    });

    it("Should revert if zero is allocated to a grantee", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr2, 100n]);
      await council.write.addGrantee(["Grantee", addr2]);

      const allocation = { accounts: [addr2], amounts: [0n] };
      await expect(
        council.write.allocateBudget([allocation], {
          account: addr2,
        }),
      ).to.be.rejectedWith("AmountMustBeGreaterThanZero");
    });

    it("Should revert if allocation exceeds voting power", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr2, 100n]);
      await council.write.addGrantee(["Grantee", addr2]);

      const allocation = { accounts: [addr2], amounts: [150n] };
      await expect(
        council.write.allocateBudget([allocation], {
          account: addr2,
        }),
      ).to.be.rejectedWith("TotalAllocatedExceedsBalance");
    });
  });

  describe("Withdrawal", () => {
    async function mintToken(councilAddr: `0x${string}`) {
      const token = await viem.deployContract("ERC20Mock", [
        "Test Token",
        "TT",
      ]);
      await token.write.mint([councilAddr, parseUnits("0.1", 18)]);
      return token;
    }
    it("Should allow the admin to withdraw tokens", async () => {
      const { council, wallet1, publicClient } = await loadFixture(deploy);
      const token = await mintToken(council.address);
      const tx = await council.write.withdraw([token.address]);
      expect(await token.read.balanceOf([council.address])).to.equal(0n);
      expect(await token.read.balanceOf([wallet1.account.address])).to.equal(
        parseUnits("0.1", 18),
      );
      await expectEvent(
        tx,
        publicClient,
        "Withdrawn(address token, address account, uint256 amount)",
        {
          token: getAddress(token.address),
          account: getAddress(wallet1.account.address),
          amount: parseUnits("0.1", 18),
        },
      );
    });

    it("Should revert if withdrawing tokens from a non-admin", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      const token = await mintToken(council.address);
      await expect(
        council.write.withdraw([token.address], { account: addr2 }),
      ).to.be.rejectedWith("AccessControlUnauthorizedAccount");
    });
  });
});
