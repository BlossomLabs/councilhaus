import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

export const useAllocation = (
  council: `0x${string}` | undefined,
  councilMember: `0x${string}` | undefined,
) => {
  const url =
    "https://api.goldsky.com/api/public/project_cm10r8z66lbri01se6301ddxj/subgraphs/councilhaus/0.0.1/gn";
  const query = gql`
    query LastAllocation($council: String, $councilMember: String) {
      allocations(
        first: 1
        where: { council: $council, councilMember: $councilMember }
        orderBy: allocatedAt
        orderDirection: desc
      ) {
        grantees {
          id
        }
        amounts
      }
    }
  `;
  const { data, isLoading } = useQuery<{
    allocations: {
      grantees: { id: string }[];
      amounts: string[];
    }[];
  }>({
    queryKey: ["allocation"],
    async queryFn() {
      return await request(url, query, {
        council: council?.toLowerCase(),
        councilMember: councilMember?.toLowerCase(),
      });
    },
    enabled: !!council && !!councilMember,
  });
  const allocation = data?.allocations?.[0];
  if (!allocation) {
    return { data: undefined, isLoading };
  }
  const formattedAllocation: { [grantee: `0x${string}`]: number } =
    Object.fromEntries(
      allocation.grantees.map((g, index) => [
        g.id as `0x${string}`,
        Number(allocation.amounts[index]),
      ]),
    );
  return {
    data: formattedAllocation,
    isLoading,
  };
};
