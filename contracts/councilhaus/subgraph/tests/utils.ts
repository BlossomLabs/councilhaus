import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as";
import { CouncilCreated } from "../generated/CouncilFactory/CouncilFactory";
import {
  BudgetAllocated,
  CouncilMemberAdded,
  CouncilMemberRemoved,
  GranteeAdded,
  GranteeRemoved,
  MaxAllocationsPerMemberSet,
} from "../generated/templates/Council/Council";

export function createCouncilCreatedEvent(
  council: Address,
  pool: Address,
): CouncilCreated {
  const councilCreatedEvent = changetype<CouncilCreated>(newMockEvent());

  councilCreatedEvent.parameters = new Array();

  councilCreatedEvent.parameters.push(
    new ethereum.EventParam("council", ethereum.Value.fromAddress(council)),
  );
  councilCreatedEvent.parameters.push(
    new ethereum.EventParam("pool", ethereum.Value.fromAddress(pool)),
  );

  return councilCreatedEvent;
}

export function createCouncilMemberAddedEvent(
  member: Address,
  votingPower: BigInt,
  council: Address,
): CouncilMemberAdded {
  const event = changetype<CouncilMemberAdded>(newMockEvent());
  event.address = council;
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("member", ethereum.Value.fromAddress(member)),
  );
  event.parameters.push(
    new ethereum.EventParam(
      "votingPower",
      ethereum.Value.fromUnsignedBigInt(votingPower),
    ),
  );
  return event;
}

export function createCouncilMemberRemovedEvent(
  member: Address,
  council: Address,
): CouncilMemberRemoved {
  const event = changetype<CouncilMemberRemoved>(newMockEvent());
  event.address = council;
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("member", ethereum.Value.fromAddress(member)),
  );
  return event;
}

export function createGranteeAddedEvent(
  grantee: Address,
  name: string,
  council: Address,
): GranteeAdded {
  const event = changetype<GranteeAdded>(newMockEvent());
  event.address = council;
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("name", ethereum.Value.fromString(name)),
  );
  event.parameters.push(
    new ethereum.EventParam("grantee", ethereum.Value.fromAddress(grantee)),
  );
  return event;
}

export function createGranteeRemovedEvent(
  grantee: Address,
  council: Address,
): GranteeRemoved {
  const event = changetype<GranteeRemoved>(newMockEvent());
  event.address = council;
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("grantee", ethereum.Value.fromAddress(grantee)),
  );
  return event;
}

export function createBudgetAllocatedEvent(
  member: Address,
  amounts: BigInt[],
  accounts: Address[],
  council: Address,
): BudgetAllocated {
  const event = changetype<BudgetAllocated>(newMockEvent());
  event.address = council;
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("member", ethereum.Value.fromAddress(member)),
  );
  const allocation: Array<ethereum.Value> = [
    ethereum.Value.fromAddressArray(accounts),
    ethereum.Value.fromUnsignedBigIntArray(amounts),
  ];
  event.parameters.push(
    new ethereum.EventParam(
      "allocation",
      ethereum.Value.fromTuple(changetype<ethereum.Tuple>(allocation)),
    ),
  );
  return event;
}

export function createMaxAllocationsPerMemberSetEvent(
  council: Address,
  maxAllocationsPerMember: BigInt,
): MaxAllocationsPerMemberSet {
  const event = changetype<MaxAllocationsPerMemberSet>(newMockEvent());
  event.address = council;
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam(
      "maxAllocationsPerMember",
      ethereum.Value.fromI32(maxAllocationsPerMember.toI32()),
    ),
  );
  return event;
}
