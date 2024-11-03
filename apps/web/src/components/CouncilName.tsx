"use client";

import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";
export function CouncilName({
  name,
  className,
}: { name: string | undefined; className?: string }) {
  if (!name) return <CouncilNameSkeleton className={className} />;
  return (
    <>
      <h1 className={className}>{name}</h1>
    </>
  );
}

function CouncilNameSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("w-1/3 mx-auto", className)} />;
}
