import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { viem } from "hardhat";
import { getAddress, parseUnits } from "viem";
import { expectEvent } from "./utils";

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
  });

  describe("Non-Transferable Token Tests", () => {
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

    it("Should allow MEMBER_MANAGER_ROLE to remove council members and clear their allocations", async () => {
      const { council, pool, addr1, addr2, publicClient } =
        await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);
      await council.write.addGrantee(["Grantee", addr2]);
      await council.write.allocateBudget([
        { grantees: [addr2], amounts: [50n] },
      ]);
      expect(await pool.read.getUnits([addr2])).to.equal(50n);
      const tx = await council.write.removeCouncilMember([addr1]);
      expect(await council.read.balanceOf([addr1])).to.equal(0n);
      expect(await pool.read.getUnits([addr2])).to.equal(0n);
      await expectEvent(
        tx,
        publicClient,
        "CouncilMemberRemoved(address member)",
        {
          member: getAddress(addr1),
        },
      );
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

      const allocation = { grantees: [addr2], amounts: [50n] };
      const tx = await council.write.allocateBudget([allocation]);
      const allocationResult = await council.read.getAllocation([addr1]);
      expect(allocationResult.grantees[0].toLowerCase()).to.equal(addr2);
      expect(allocationResult.amounts[0]).to.equal(50n);
      await expectEvent(
        tx,
        publicClient,
        "BudgetAllocated(address member, (address[],uint128[]) allocation)",
        {
          member: getAddress(addr1),
          allocation: [allocation.grantees.map(getAddress), allocation.amounts],
        },
      );
    });

    it("Should revert if allocation exceeds voting power", async () => {
      const { council, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr2, 100n]);
      await council.write.addGrantee(["Grantee", addr2]);

      const allocation = { grantees: [addr2], amounts: [150n] };
      await expect(
        council.write.allocateBudget([allocation], {
          account: addr2,
        }),
      ).to.be.rejectedWith("TotalAllocatedExceedsBalance");
    });
  });

  describe("Withdrawal", () => {
    it("Should allow the admin to withdraw tokens", async () => {
      const { council, wallet1, publicClient } = await loadFixture(deploy);
      const token = await viem.deployContract("ERC20Mock", [
        "Test Token",
        "TT",
      ]);
      await token.write.mint([council.address, parseUnits("0.1", 18)]);
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
  });
});
