import { Skeleton } from "@repo/ui/components/ui/skeleton";

export function SkeletonVote() {
  return (
    <div className="flex flex-col space-y-3">
      <div className="h-12 flex justify-between items-center">
        <Skeleton className="w-3/5 h-5" />
        <Skeleton className="w-1/5 h-3" />
      </div>

      <div className="space-y-2 mt-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}
