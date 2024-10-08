import { BigInt } from "@graphprotocol/graph-ts";
import { log } from "@graphprotocol/graph-ts";
import {
  Allocation,
  Council,
  CouncilMember,
  Grantee,
} from "../generated/schema";
import {
  BudgetAllocated,
  CouncilMemberAdded,
  CouncilMemberRemoved,
  GranteeAdded,
  GranteeRemoved,
  MaxAllocationsPerMemberSet,
} from "../generated/templates/Council/Council";

// Handle council member added
export function handleCouncilMemberAdded(event: CouncilMemberAdded): void {
  const councilMember = new CouncilMember(
    `${event.address.toHex()}-${event.params.member.toHex()}`,
  );
  councilMember.account = event.params.member;
  councilMember.votingPower = event.params.votingPower;
  councilMember.council = event.address.toHex(); // Linking to the council
  councilMember.enabled = true;

  councilMember.save();
}

// Handle council member removed
export function handleCouncilMemberRemoved(event: CouncilMemberRemoved): void {
  const councilMemberId = `${event.address.toHex()}-${event.params.member.toHex()}`;
  const councilMember = CouncilMember.load(councilMemberId);
  if (councilMember) {
    councilMember.votingPower = new BigInt(0);
    councilMember.enabled = false;
    councilMember.save();
  } else {
    log.warning("Council member not found, skipping removal", [
      councilMemberId,
    ]);
  }
}

// Handle grantee added
export function handleGranteeAdded(event: GranteeAdded): void {
  const grantee = new Grantee(
    `${event.address.toHex()}-${event.params.grantee.toHex()}`,
  );
  grantee.name = event.params.name;
  grantee.account = event.params.grantee;
  grantee.council = event.address.toHex(); // Linking to the council
  grantee.enabled = true;

  grantee.save();
}

// Handle grantee removed
export function handleGranteeRemoved(event: GranteeRemoved): void {
  const grantee = Grantee.load(
    `${event.address.toHex()}-${event.params.grantee.toHex()}`,
  );
  if (grantee) {
    grantee.enabled = false;
    grantee.save();
  } else {
    log.warning("Grantee not found, skipping removal", [
      event.params.grantee.toHex(),
    ]);
  }
}

// Handle budget allocated
export function handleBudgetAllocated(event: BudgetAllocated): void {
  const allocation = new Allocation(
    `${event.transaction.hash.toHex()}-${event.logIndex.toString()}`,
  );

  const councilMember = CouncilMember.load(
    `${event.address.toHex()}-${event.params.member.toHex()}`,
  );
  if (!councilMember) {
    log.warning("Council member not found, skipping allocation", [
      event.params.member.toHex(),
    ]);
    return;
  }
  allocation.council = event.address.toHex();
  allocation.councilMember = councilMember.id;
  allocation.allocatedAt = event.block.timestamp;
  allocation.amounts = event.params.allocation.amounts;

  // Check all grantees are valid
  const grantees: string[] = [];
  const accounts = event.params.allocation.accounts;
  for (let i = 0; i < accounts.length; i++) {
    const grantee = Grantee.load(
      `${event.address.toHex()}-${accounts[i].toHex()}`,
    );
    if (!grantee) {
      log.warning("Not all grantees found, skipping allocation", [
        accounts[i].toHex(),
      ]);
      return;
    }
    grantees.push(grantee.id);
  }
  allocation.grantees = grantees;
  allocation.save();
}

// Handle max allocations per member set
export function handleMaxAllocationsPerMemberSet(
  event: MaxAllocationsPerMemberSet,
): void {
  const council = Council.load(event.address.toHex());
  if (council) {
    council.maxAllocationsPerMember = event.params.maxAllocationsPerMember;
    council.save();
  }
}
