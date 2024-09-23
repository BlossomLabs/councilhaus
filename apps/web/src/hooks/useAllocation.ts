import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

export const useAllocation = (
  council: `0x${string}` | undefined,
  councilMember: `0x${string}` | undefined,
) => {
  const url =
    "https://api.goldsky.com/api/public/project_cm10r8z66lbri01se6301ddxj/subgraphs/councilhaus/0.0.2/gn";
  const query = gql`
    query LastAllocation($council: String, $councilMember: String) {
      councilMember(id: $councilMember) {
        votingPower
      }
      allocations(
        first: 1
        where: { council: $council, councilMember: $councilMember }
        orderBy: allocatedAt
        orderDirection: desc
      ) {
        grantees {
          account
        }
        amounts
      }
    }
  `;
  const { data, isLoading } = useQuery<{
    councilMember: {
      votingPower: string;
    };
    allocations: {
      grantees: { account: string }[];
      amounts: string[];
    }[];
  }>({
    queryKey: ["allocation"],
    async queryFn() {
      return await request(url, query, {
        council: council?.toLowerCase(),
        councilMember: `${council?.toLowerCase()}-${councilMember?.toLowerCase()}`,
      });
    },
    enabled: !!council && !!councilMember,
  });
  const allocation = data?.allocations?.[0];
  if (!allocation) {
    return { data: undefined, isLoading, votingPower: 0 };
  }
  const formattedAllocation: { [grantee: `0x${string}`]: number } =
    Object.fromEntries(
      allocation.grantees.map((g, index) => [
        g.account as `0x${string}`,
        Number(allocation.amounts[index]),
      ]),
    );
  return {
    data: formattedAllocation,
    votingPower: Number(data?.councilMember?.votingPower ?? 0),
    isLoading,
  };
};
