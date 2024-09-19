import { Address, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as";
import { CouncilCreated } from "../generated/CouncilFactory/CouncilFactory";

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
