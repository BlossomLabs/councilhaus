"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAddress } from "viem";
import { CouncilName } from "../components/CouncilName";
import VotingCard from "../components/VotingCard";
import { getGrantees } from "../utils/grantees";

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
  const { data: grantees, isLoading } = useQuery({
    queryKey: ["grantees", council],
    queryFn: () => council && getGrantees(council),
    enabled: !!council, // Only run query if council is defined
  });
  return (
    <main>
      <CouncilName
        council={council}
        className="h-12 text-4xl font-bold mb-4 text-accent"
      />
      <VotingCard
        className="max-w-lg mx-auto"
        council={council}
        projects={grantees ?? []}
        maxVotedProjects={3}
        isLoading={isLoading || !council}
      />
    </main>
  );
}
