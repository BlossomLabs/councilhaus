import { useAccount, useBalance } from "wagmi";

function alertAllocation(
  allocation: { account: `0x${string}`; amount: number }[],
) {
  alert(
    allocation
      .map(
        ({ account, amount }) =>
          `${account.slice(0, 6)}...${account.slice(-4)}: ${amount}`,
      )
      .join("\n"),
  );
}

export const useWriteAllocation = (council: `0x${string}`) => {
  const { address } = useAccount();
  const balance = useBalance({
    address,
    token: council,
  });
  return (allocation: { account: `0x${string}`; ratio: number }[]) => {
    alertAllocation(
      allocation.map(({ account, ratio }) => ({
        account,
        amount: ratio * Number(balance.data?.value),
      })),
    );
  };
};
