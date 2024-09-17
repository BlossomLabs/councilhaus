"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getAddress } from "viem";
import { CouncilName } from "../components/CouncilName";
import VotingCard from "../components/VotingCard";
import { getGrantees } from "../utils/grantees";

export default function Page() {
  const router = useRouter();
  if (!window.location.hash) {
    router.push("#0xB62f1Be9460cf2BEF90dB45dc90689C52C23F1B0");
  }
  const council = getAddress(window.location.hash.slice(1));
  const { data: grantees, isLoading } = useQuery({
    queryKey: ["grantees", council],
    queryFn: () => getGrantees(council),
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
        projects={grantees || []}
        maxVotedProjects={3}
        isLoading={isLoading}
      />
    </main>
  );
}
