"use client";

import { Badge } from "@repo/ui/components/ui/badge";
import { Label } from "@repo/ui/components/ui/label";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAddress } from "viem";
import { useAccount, useChains } from "wagmi";
import { DEFAULT_COUNCIL_ADDRESS, NETWORK } from "../../../../constants";
import { CouncilName } from "../components/CouncilName";
import VotingCard from "../components/VotingCard";
import { useAllocation } from "../hooks/useAllocation";
import { useCouncil } from "../hooks/useCouncil";

export default function Page() {
  const router = useRouter();
  const [council, setCouncil] = useState<`0x${string}` | undefined>(undefined);

  useEffect(() => {
    // Ensure the code runs only on the client side
    if (!window.location.hash) {
      router.push(`#${DEFAULT_COUNCIL_ADDRESS}`);
    }
    // Set the council value once the hash is present
    const address = getAddress(
      window.location.hash?.slice(1) || DEFAULT_COUNCIL_ADDRESS,
    );
    setCouncil(address);
  }, [router]);

  // Fetch data when the council is available
  const { address } = useAccount();
  const {
    councilName,
    councilMembers,
    grantees,
    maxAllocationsPerMember,
    pool,
    isLoading,
  } = useCouncil(council);
  const { data: myAllocation, votingPower } = useAllocation(council, address);

  const totalVotingPower = councilMembers?.reduce(
    (acc, curr) => acc + Number(curr.votingPower),
    0,
  );

  return (
    <main>
      <Link
        href={`https://explorer.superfluid.finance/${NETWORK}-mainnet/accounts/${council}?tab=pools`}
        target="_blank"
      >
        <CouncilName
          name={councilName}
          className="min-h-12 text-4xl font-bold mb-4 text-accent text-center"
        />
      </Link>
      <div className="flex flex-col gap-4 mb-4 text-justify">
        {totalVotingPower ? (
          !address ? (
            <p className="text-center">
              Connect your wallet to view your voting power and budget
              allocation.
            </p>
          ) : (
            <>
              {votingPower ? (
                <p>
                  You are 1 of {councilMembers?.length} council members, holding{" "}
                  {((votingPower / totalVotingPower) * 100).toFixed(2)}% of the
                  total voting power. Your vote plays a significant role in
                  determining how the budget is allocated to projects. Use your
                  influence wisely.
                </p>
              ) : (
                <p>
                  You are not currently a council member. Only council members
                  have voting power and can influence budget allocations. Stay
                  tuned for future opportunities to join the council.
                </p>
              )}
            </>
          )
        ) : (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </>
        )}
      </div>
      <VotingCard
        className="max-w-lg mx-auto"
        council={council}
        projects={grantees ?? []}
        initialAllocation={myAllocation}
        maxVotedProjects={maxAllocationsPerMember ?? 0}
        isLoading={isLoading || !council}
        votingPower={votingPower}
      />
      <ContractLinks
        council={council}
        pool={pool}
        className="mt-4 justify-center"
      />
    </main>
  );
}

function ContractLinks({
  council,
  pool,
  className,
}: {
  council: string | undefined;
  pool: string | undefined;
  className?: string;
}) {
  const chains = useChains();
  const chain = chains[0]; // It should be the one defined in NETWORK
  const explorer = chain?.blockExplorers?.default.url;
  return (
    <div className={cn("flex flex-row gap-1 mb-4 items-center", className)}>
      <Label className="pr-2">Contracts: </Label>
      <Badge variant="outline">
        <Link href={`${explorer}/address/${council}`} target="_blank">
          Council
        </Link>
      </Badge>
      <Badge variant="outline">
        <Link href={`${explorer}/address/${pool}`} target="_blank">
          Pool
        </Link>
      </Badge>
    </div>
  );
}
