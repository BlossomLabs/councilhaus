"use client";

import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";

export function CouncilName({
  name,
  className,
}: { name: string | undefined; className?: string }) {
  if (!name) return <Skeleton className={cn("w-1/3 ", className)} />;
  return <h1 className={className}>{name}</h1>;
}
