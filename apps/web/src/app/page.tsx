"use client";

import { Badge } from "@repo/ui/components/ui/badge";
import { Label } from "@repo/ui/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAddress } from "viem";
import { useAccount } from "wagmi";
import { DEFAULT_COUNCIL_ADDRESS } from "../../../../constants";
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
  const { data: councilData, isLoading } = useCouncil(council);
  const { data: myAllocation, votingPower } = useAllocation(council, address);
  const grantees = councilData?.grantees;

  return (
    <main>
      <ContractLinks council={council} pool={councilData?.pool} />
      <Link
        href={`https://explorer.superfluid.finance/optimism-mainnet/accounts/${council}?tab=pools`}
        target="_blank"
      >
        <CouncilName
          name={councilData?.councilName}
          className="h-12 text-4xl font-bold mb-4 text-accent"
        />
      </Link>
      <VotingCard
        className="max-w-lg mx-auto"
        council={council}
        projects={grantees ?? []}
        initialAllocation={myAllocation}
        maxVotedProjects={councilData?.maxAllocationsPerMember ?? 0}
        isLoading={isLoading || !council}
        votingPower={votingPower}
      />
    </main>
  );
}

function ContractLinks({
  council,
  pool,
}: { council: string | undefined; pool: string | undefined }) {
  return (
    <div className="flex flex-row gap-1 mb-4 items-center justify-end">
      <Label className="pr-2">Contracts: </Label>
      <Badge variant="outline">
        <Link
          href={`https://explorer.optimism.io/address/${council}`}
          target="_blank"
        >
          Council
        </Link>
      </Badge>
      <Badge variant="outline">
        <Link
          href={`https://explorer.optimism.io/address/${pool}`}
          target="_blank"
        >
          Pool
        </Link>
      </Badge>
    </div>
  );
}
