"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAddress } from "viem";
import { useAccount } from "wagmi";
import { CouncilName } from "../components/CouncilName";
import VotingCard from "../components/VotingCard";
import { useAllocation } from "../hooks/useAllocation";
import { useCouncil } from "../hooks/useCouncil";

const defaultCouncil = "0x5cE162b6e6Dd6B936B9dC183Df79F61DBf8c675f";

export default function Page() {
  const router = useRouter();
  const [council, setCouncil] = useState<`0x${string}` | undefined>(undefined);

  useEffect(() => {
    // Ensure the code runs only on the client side
    if (!window.location.hash) {
      router.push(`#${defaultCouncil}`);
    }
    // Set the council value once the hash is present
    const address = getAddress(
      window.location.hash?.slice(1) || defaultCouncil,
    );
    setCouncil(address);
  }, [router]);

  // Fetch data when the council is available
  const { address } = useAccount();
  const { data: councilData, isLoading } = useCouncil(council);
  const { data: myAllocation } = useAllocation(council, address);
  const grantees = councilData?.grantees;

  return (
    <main>
      <CouncilName
        name={councilData?.councilName}
        className="h-12 text-4xl font-bold mb-4 text-accent"
      />
      <VotingCard
        className="max-w-lg mx-auto"
        council={council}
        projects={grantees ?? []}
        initialAllocation={myAllocation}
        maxVotedProjects={3}
        isLoading={isLoading || !council}
      />
    </main>
  );
}
