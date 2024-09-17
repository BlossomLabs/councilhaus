import { parseAbi } from "viem";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useWalletClient,
} from "wagmi";

export const useWriteAllocation = (council: `0x${string}` | undefined) => {
  const { address } = useAccount();
  const balance = useBalance({
    address,
    token: council,
    query: {
      enabled: !!council,
    },
  });
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  return async (allocation: { account: `0x${string}`; ratio: bigint }[]) => {
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
          amounts: allocation.map(
            ({ ratio }) =>
              (ratio * BigInt(balance.data?.value ?? 0)) / 2n ** 128n,
          ),
        },
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== "success") {
      throw new Error("Transaction failed");
    }
  };
};
