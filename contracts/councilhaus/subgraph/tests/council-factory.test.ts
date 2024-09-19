import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  assert,
  afterAll,
  beforeAll,
  clearStore,
  describe,
  mockFunction,
  test,
} from "matchstick-as/assembly/index";
import { handleCouncilCreated } from "../src/council-factory";
import { createCouncilCreatedEvent } from "./council-factory-utils";

describe("Describe entity assertions", () => {
  beforeAll(() => {
    const councilAddress = Address.fromString(
      "0x0000000000000000000000000000000000000001",
    );
    const pool = Address.fromString(
      "0x0000000000000000000000000000000000000002",
    );
    const newCouncilCreatedEvent = createCouncilCreatedEvent(
      councilAddress,
      pool,
    );

    mockFunction(
      councilAddress,
      "name",
      "name():(string)",
      [],
      [ethereum.Value.fromString("Test Council")],
      false,
    );
    mockFunction(
      councilAddress,
      "symbol",
      "symbol():(string)",
      [],
      [ethereum.Value.fromString("TST")],
      false,
    );
    mockFunction(
      councilAddress,
      "distributionToken",
      "distributionToken():(address)",
      [],
      [
        ethereum.Value.fromAddress(
          Address.fromString("0x0000000000000000000000000000000000000003"),
        ),
      ],
      false,
    );

    handleCouncilCreated(newCouncilCreatedEvent);
  });

  afterAll(() => {
    clearStore();
  });

  test("Council created and stored", () => {
    assert.entityCount("Council", 1);

    const councilId = "0x0000000000000000000000000000000000000001";

    assert.fieldEquals("Council", councilId, "councilName", "Test Council");
    assert.fieldEquals("Council", councilId, "councilSymbol", "TST");
    assert.fieldEquals(
      "Council",
      councilId,
      "pool",
      "0x0000000000000000000000000000000000000002",
    );
    assert.fieldEquals(
      "Council",
      councilId,
      "distributionToken",
      "0x0000000000000000000000000000000000000003",
    );
  });
});
