import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { getCouncilImage } from "../utils/council";

export const useCouncil = (council: `0x${string}` | undefined) => {
  const url =
    "https://api.goldsky.com/api/public/project_cm10r8z66lbri01se6301ddxj/subgraphs/councilhaus-base/0.0.2/gn";
  const query = gql`
      query CouncilNameAndGrantees($council: String) {
        council(id: $council) {
          councilName
          pool
          councilMembers {
            account
            votingPower
            enabled
          }
          grantees {
            name
            account
            enabled
          }
          maxAllocationsPerMember
        }
      }`;
  const { data, isLoading } = useQuery<{
    council: {
      councilName: string;
      councilMembers: {
        account: `0x${string}`;
        votingPower: number;
        enabled: boolean;
      }[];
      grantees: { name: string; account: `0x${string}`; enabled: boolean }[];
      maxAllocationsPerMember: number;
      pool: string;
    };
  }>({
    queryKey: ["council", council],
    async queryFn() {
      return await request(url, query, { council: council?.toLowerCase() });
    },
    enabled: !!council,
  });

  const councilImage = getCouncilImage(council);
  return {
    councilName: data?.council?.councilName,
    councilImage,
    councilMembers: data?.council?.councilMembers.filter((m) => m.enabled),
    grantees: data?.council?.grantees.filter((g) => g.enabled),
    maxAllocationsPerMember: data?.council?.maxAllocationsPerMember,
    pool: data?.council?.pool,
    isLoading,
  };
};
