import { parseAbi } from "viem";
import { usePublicClient, useWalletClient } from "wagmi";

export const useWriteAllocation = (council: `0x${string}` | undefined) => {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  return async (allocation: { account: `0x${string}`; amount: bigint }[]) => {
    if (!council || !walletClient || !publicClient) {
      throw new Error("Council or client is not set");
    }

    const hash = await walletClient.writeContract({
      abi: parseAbi([
        "struct Allocation { address[] accounts; uint128[] amounts; }",
        "function allocateBudget(Allocation memory _allocation) public",
      ]),
      address: council,
      functionName: "allocateBudget",
      args: [
        {
          accounts: allocation.map(({ account }) => account),
          amounts: allocation.map(({ amount }) => amount),
        },
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== "success") {
      throw new Error("Transaction failed");
    }
  };
};
