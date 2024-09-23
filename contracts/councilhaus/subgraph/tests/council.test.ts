import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  assert,
  beforeEach,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import {
  handleBudgetAllocated,
  handleCouncilMemberAdded,
  handleCouncilMemberRemoved,
  handleGranteeAdded,
  handleGranteeRemoved,
} from "../src/council";
import {
  createBudgetAllocatedEvent,
  createCouncilMemberAddedEvent,
  createCouncilMemberRemovedEvent,
  createGranteeAddedEvent,
  createGranteeRemovedEvent,
} from "./utils";

const COUNCIL_ADDRESS = "0x0000000000000000000000000000000000000001";

describe("Council entity assertions", () => {
  beforeEach(() => {
    clearStore();
  });

  test("CouncilMember added and stored", () => {
    const memberAddress = Address.fromString(
      "0x0000000000000000000000000000000000000002",
    );
    const votingPower = BigInt.fromI32(100);
    const newCouncilMemberAddedEvent = createCouncilMemberAddedEvent(
      memberAddress,
      votingPower,
      Address.fromString(COUNCIL_ADDRESS),
    );

    handleCouncilMemberAdded(newCouncilMemberAddedEvent);

    assert.entityCount("CouncilMember", 1);
    assert.fieldEquals(
      "CouncilMember",
      `${COUNCIL_ADDRESS}-${memberAddress.toHexString()}`,
      "account",
      memberAddress.toHexString(),
    );
    assert.fieldEquals(
      "CouncilMember",
      `${COUNCIL_ADDRESS}-${memberAddress.toHexString()}`,
      "votingPower",
      votingPower.toString(),
    );
    assert.fieldEquals(
      "CouncilMember",
      `${COUNCIL_ADDRESS}-${memberAddress.toHexString()}`,
      "council",
      COUNCIL_ADDRESS,
    );
    assert.fieldEquals(
      "CouncilMember",
      `${COUNCIL_ADDRESS}-${memberAddress.toHexString()}`,
      "enabled",
      "true",
    );
  });

  test("CouncilMember removed", () => {
    // First, add a council member
    const memberAddress = Address.fromString(
      "0x0000000000000000000000000000000000000002",
    );
    const votingPower = BigInt.fromI32(100);
    const addEvent = createCouncilMemberAddedEvent(
      memberAddress,
      votingPower,
      Address.fromString(COUNCIL_ADDRESS),
    );
    handleCouncilMemberAdded(addEvent);

    // Now remove the council member
    const removeEvent = createCouncilMemberRemovedEvent(
      memberAddress,
      Address.fromString(COUNCIL_ADDRESS),
    );
    handleCouncilMemberRemoved(removeEvent);

    assert.fieldEquals(
      "CouncilMember",
      `${COUNCIL_ADDRESS}-${memberAddress.toHexString()}`,
      "votingPower",
      "0",
    );
    assert.fieldEquals(
      "CouncilMember",
      `${COUNCIL_ADDRESS}-${memberAddress.toHexString()}`,
      "enabled",
      "false",
    );

    // We check that running the handler again does not throw an error
    handleCouncilMemberRemoved(removeEvent);
  });

  test("Grantee added and stored", () => {
    const granteeAddress = Address.fromString(
      "0x0000000000000000000000000000000000000003",
    );
    const granteeName = "Test Grantee";
    const newGranteeAddedEvent = createGranteeAddedEvent(
      granteeAddress,
      granteeName,
      Address.fromString(COUNCIL_ADDRESS),
    );

    handleGranteeAdded(newGranteeAddedEvent);

    assert.entityCount("Grantee", 1);
    assert.fieldEquals(
      "Grantee",
      `${COUNCIL_ADDRESS}-${granteeAddress.toHexString()}`,
      "name",
      granteeName,
    );
    assert.fieldEquals(
      "Grantee",
      `${COUNCIL_ADDRESS}-${granteeAddress.toHexString()}`,
      "account",
      granteeAddress.toHexString(),
    );
    assert.fieldEquals(
      "Grantee",
      `${COUNCIL_ADDRESS}-${granteeAddress.toHexString()}`,
      "council",
      COUNCIL_ADDRESS,
    );
    assert.fieldEquals(
      "Grantee",
      `${COUNCIL_ADDRESS}-${granteeAddress.toHexString()}`,
      "enabled",
      "true",
    );
  });

  test("Grantee removed", () => {
    // First, add a grantee
    const granteeAddress = Address.fromString(
      "0x0000000000000000000000000000000000000003",
    );
    const granteeName = "Test Grantee";

    const addEvent = createGranteeAddedEvent(
      granteeAddress,
      granteeName,
      Address.fromString(COUNCIL_ADDRESS),
    );
    handleGranteeAdded(addEvent);

    // // Now remove the grantee
    const removeEvent = createGranteeRemovedEvent(
      granteeAddress,
      Address.fromString(COUNCIL_ADDRESS),
    );
    handleGranteeRemoved(removeEvent);

    assert.fieldEquals(
      "Grantee",
      `${COUNCIL_ADDRESS}-${granteeAddress.toHexString()}`,
      "enabled",
      "false",
    );

    // We check that running the handler again does not throw an error
    handleGranteeRemoved(removeEvent);
  });

  test("Budget allocated", () => {
    // First, add a council member and a grantee
    const memberAddress = Address.fromString(
      "0x0000000000000000000000000000000000000002",
    );
    const granteeAddress = Address.fromString(
      "0x0000000000000000000000000000000000000003",
    );

    handleCouncilMemberAdded(
      createCouncilMemberAddedEvent(
        memberAddress,
        BigInt.fromI32(100),
        Address.fromString(COUNCIL_ADDRESS),
      ),
    );
    handleGranteeAdded(
      createGranteeAddedEvent(
        granteeAddress,
        "Test Grantee",
        Address.fromString(COUNCIL_ADDRESS),
      ),
    );

    // Now allocate budget
    const amounts = [BigInt.fromI32(1000)];
    const accounts = [granteeAddress];
    const newBudgetAllocatedEvent = createBudgetAllocatedEvent(
      memberAddress,
      amounts,
      accounts,
      Address.fromString(COUNCIL_ADDRESS),
    );

    handleBudgetAllocated(newBudgetAllocatedEvent);

    assert.entityCount("Allocation", 1);
    const allocationId = `${newBudgetAllocatedEvent.transaction.hash.toHex()}-${newBudgetAllocatedEvent.logIndex.toString()}`;
    assert.fieldEquals("Allocation", allocationId, "council", COUNCIL_ADDRESS);
    assert.fieldEquals(
      "Allocation",
      allocationId,
      "councilMember",
      `${COUNCIL_ADDRESS}-${memberAddress.toHexString()}`,
    );
    assert.fieldEquals("Allocation", allocationId, "amounts", "[1000]");
    assert.fieldEquals(
      "Allocation",
      allocationId,
      "grantees",
      `[${COUNCIL_ADDRESS}-${granteeAddress.toHexString()}]`,
    );
  });
});
