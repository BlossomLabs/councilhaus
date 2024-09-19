import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

export const useCouncil = (council: `0x${string}` | undefined) => {
  const url =
    "https://api.goldsky.com/api/public/project_cm10r8z66lbri01se6301ddxj/subgraphs/councilhaus/0.0.1/gn";
  const query = gql`
      query CouncilNameAndGrantees($council: String) {
        council(id: $council) {
          councilName
          grantees {
            name
            account
          }
        }
      }`;
  console.log(url, query, council);
  const { data, isLoading } = useQuery<{
    council: {
      councilName: string;
      grantees: { name: string; account: `0x${string}` }[];
    };
  }>({
    queryKey: ["data"],
    async queryFn() {
      return await request(url, query, { council: council?.toLowerCase() });
    },
    enabled: !!council,
  });
  return { data: data?.council, isLoading };
};
