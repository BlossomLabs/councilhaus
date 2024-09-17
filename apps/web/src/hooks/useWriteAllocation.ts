import { useAccount, useBalance } from "wagmi";

function alertAllocation(
  allocation: { account: `0x${string}`; amount: bigint }[],
) {
  console.log(allocation.reduce((acc, { amount }) => acc + amount, BigInt(0)));
  alert(
    allocation
      .map(
        ({ account, amount }) =>
          `${account.slice(0, 6)}...${account.slice(-4)}: ${amount}`,
      )
      .join("\n"),
  );
}

export const useWriteAllocation = (council: `0x${string}` | undefined) => {
  const { address } = useAccount();
  const balance = useBalance({
    address,
    token: council,
    query: {
      enabled: !!council,
    },
  });
  return (allocation: { account: `0x${string}`; ratio: bigint }[]) => {
    console.log(allocation);
    alertAllocation(
      allocation.map(({ account, ratio }) => ({
        account,
        amount: (ratio * BigInt(balance.data?.value ?? 0)) / 2n ** 128n,
      })),
    );
  };
};
