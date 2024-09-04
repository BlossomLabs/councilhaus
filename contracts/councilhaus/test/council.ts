import { viem } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { parseUnits } from "viem";

const gdav1ForwarderAddress = "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08";
const ethxTokenAddress = "0x4ac8bD1bDaE47beeF2D1c6Aa62229509b962Aa0d";

// A deployment function to set up the initial state
const deploy = async () => {
  const publicClient = await viem.getPublicClient();
  const [wallet1, wallet2] = await viem.getWalletClients();

  const council = await viem.deployContract("Council", [
    "Spacing Guild",
    "SPA",
    ethxTokenAddress,
    gdav1ForwarderAddress,
  ]);

  const pool = await viem.getContractAt("ISuperfluidPool", await council.read.pool());

  return {
    council,
    pool,
    publicClient,
    wallet1,
    wallet2,
    addr1: wallet1.account.address,
    addr2: wallet2.account.address,
  };
};

describe("Council Contract Tests", function () {
  describe("Deployment", function () {
    it("should deploy with the correct initial parameters", async function () {
      const { council } = await loadFixture(deploy);
      expect(await council.read.name()).to.equal("Spacing Guild");
      expect(await council.read.symbol()).to.equal("SPA");
      expect(await council.read.distributionToken()).to.equal(
        ethxTokenAddress,
      );
      expect(await council.read.gdav1Forwarder()).to.equal(
        gdav1ForwarderAddress,
      );
      expect(await council.read.quorum()).to.equal(500000000000000000n);
      expect(await council.read.maxAllocationsPerMember()).to.equal(10);
    });
  });

  describe("Non-Transferable Token Tests", function () {
    it("should revert on token transfer", async function () {
      const { council, addr1, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);

      await expect(
        council.write.transfer([addr2, 50n], { account: addr1 })
      ).to.be.rejectedWith("CantTransferToken");
    });

    it("should revert on token transferFrom", async function () {
      const { council, addr1, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);

      await expect(
        council.write.transferFrom([addr1, addr2, 50n], { account: addr2 })
      ).to.be.rejectedWith("CantTransferToken");
    });

    it("should revert on token approval", async function () {
      const { council, addr1, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);

      await expect(
        council.write.approve([addr2, 50n], { account: addr1 })
      ).to.be.rejectedWith("CantApproveToken");
    });
  });

  describe("Role Management", function () {
    it("Should only allow admins to manage roles", async function () {
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

  describe("Council Member Management", async function () {
    it("Should allow MEMBER_MANAGER_ROLE to add council members", async function () {
      const { council, addr2 } = await loadFixture(deploy);
      await council.write.grantRole([
        await council.read.MEMBER_MANAGER_ROLE(),
        addr2,
      ]);
      await council.write.addCouncilMember([addr2, 100n], {
        account: addr2,
      });
      expect(await council.read.balanceOf([addr2])).to.equal(100n);
    });

    it("Should allow MEMBER_MANAGER_ROLE to remove council members and clear their allocations", async function () {
      const { council, pool, addr1, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);
      await council.write.addGrantee([addr2]);
      await council.write.allocateBudget([{ grantees: [addr2], amounts: [50n] }]);
      expect(await pool.read.balanceOf([addr2])).to.equal(50n);
      await council.write.removeCouncilMember([addr1]);
      expect(await council.read.balanceOf([addr1])).to.equal(0n);
      expect(await pool.read.balanceOf([addr2])).to.equal(0n);
    });

    it("Should revert if adding a council member that already exists", async function () {
      const { council, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr2, 100n]);
      await expect(
        council.write.addCouncilMember([addr2, 100n]),
      ).to.be.rejectedWith("CouncilMemberAlreadyAdded");
    });

    it("Should revert if removing a non-existent council member", async function () {
      const { council, addr2 } = await loadFixture(deploy);
      await expect(
        council.write.removeCouncilMember([addr2]),
      ).to.be.rejectedWith("CouncilMemberNotFound");
    });
  });

  describe("Grantee Management", function () {
    it("Should allow GRANTEE_MANAGER_ROLE to add and remove grantees", async function () {
      const { council, addr2 } = await loadFixture(deploy);
      await council.write.grantRole([
        await council.read.GRANTEE_MANAGER_ROLE(),
        addr2,
      ]);
      await council.write.addGrantee([addr2], {
        account: addr2,
      });
      expect(await council.read.isGrantee([addr2])).to.be.true;
      await council.write.removeGrantee([addr2], {
        account: addr2,
      });
      expect(await council.read.isGrantee([addr2])).to.be.false;
    });

    it("Should revert if adding a grantee that already exists", async function () {
      const { council, addr2 } = await loadFixture(deploy);
      await council.write.addGrantee([addr2]);
      await expect(
        council.write.addGrantee([addr2]),
      ).to.be.rejectedWith("GranteeAlreadyAdded");
    });

    it("Should revert if removing a non-existent grantee", async function () {
      const { council, addr2 } = await loadFixture(deploy);
      await expect(
        council.write.removeGrantee([addr2]),
      ).to.be.rejectedWith("GranteeNotFound");
    });
  });

  describe("Budget Allocation", function () {
    it("Should allow council members to allocate budget", async function () {
      const { council, addr1, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);
      await council.write.addGrantee([addr2]);

      const allocation = { grantees: [addr2], amounts: [50n] };
      await council.write.allocateBudget([allocation]);
      const allocationResult = await council.read.getAllocation([addr1]);
      expect(allocationResult.grantees[0].toLowerCase()).to.equal(addr2);
      expect(allocationResult.amounts[0]).to.equal(50n);
    });

    it("Should revert if allocation exceeds voting power", async function () {
      const { council, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr2, 100n]);
      await council.write.addGrantee([addr2]);

      const allocation = { grantees: [addr2], amounts: [150n] };
      await expect(
        council.write.allocateBudget([allocation], {
          account: addr2,
        }),
      ).to.be.rejectedWith("TotalAllocatedExceedsBalance");
    });
  });

  describe("Quorum and Flow Rate Management", function () {
    it("Should allow the admin to set quorum and flow rate", async function () {
      const { council } = await loadFixture(deploy);
      await council.write.setQuorum([parseUnits("0.7", 18)]);
      expect(await council.read.quorum()).to.equal(parseUnits("0.7", 18));

      await council.write.setFlowRate([10n]);
      expect(await council.read.flowRate()).to.equal(10n);
    });
  });

  describe("Execution and Withdrawal", function () {
    it("Should execute budget when quorum is met", async function () {
      const { council, addr1, addr2 } = await loadFixture(deploy);
      await council.write.addCouncilMember([addr1, 100n]);
      await council.write.addGrantee([addr2]);
      const allocation = { grantees: [addr2], amounts: [100n] };
      await council.write.allocateBudget([allocation]);
      //   await expect(council.connect(member).executeBudget()).to.emit(gdav1ForwarderMock, 'DistributeFlow');
    });

    it("Should allow the admin to withdraw tokens", async function () {
      const { council, wallet1, publicClient } = await loadFixture(deploy);
      const ethxToken = await viem.getContractAt("ERC20", ethxTokenAddress);
      const tx = await wallet1.sendTransaction({
        to: ethxTokenAddress,
        value: parseUnits("0.1", 18),
        data: "0xcf81464b", // upgradeByETH()
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      await ethxToken.write.transfer([council.address, parseUnits("0.1", 18)]);
      await council.write.withdraw([ethxTokenAddress]);
      expect(await ethxToken.read.balanceOf([council.address])).to.equal(0n);
      expect(
        await ethxToken.read.balanceOf([wallet1.account.address]),
      ).to.equal(parseUnits("0.1", 18));
    });
  });
});
