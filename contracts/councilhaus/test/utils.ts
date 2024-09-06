import { expect } from "chai";
import { type PublicClient, parseAbiItem, parseEventLogs } from "viem";

export async function expectEvent(
  txHash: `0x${string}`,
  publicClient: PublicClient,
  eventSignature: string,
  expectedArgs: any = undefined,
) {
  const tx = await publicClient.getTransactionReceipt({ hash: txHash });
  const logs = parseEventLogs({
    abi: [parseAbiItem(`event ${eventSignature}`)],
    logs: tx.logs,
  });
  const event = logs.find((e) => e.eventName === eventSignature.split("(")[0]);
  expect(event, `Event ${eventSignature} was not emitted`).to.exist;
  if (event && typeof expectedArgs !== "undefined") {
    expect(
      event.args,
      `Event ${eventSignature} args do not match`,
    ).to.deep.equal(expectedArgs);
  }
}
