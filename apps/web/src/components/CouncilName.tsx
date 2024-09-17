"use client";

import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { parseAbi } from "viem";
import { useReadContract } from "wagmi";

export function CouncilName({
  council,
  className,
}: { council: `0x${string}` | undefined; className?: string }) {
  const { data: name, isLoading } = useReadContract({
    address: council,
    abi: parseAbi(["function name() view returns (string)"]),
    functionName: "name",
    query: {
      enabled: !!council,
    },
  });
  if (isLoading || !council)
    return <Skeleton className={cn("w-1/3 ", className)} />;
  return <h1 className={className}>{name}</h1>;
}
