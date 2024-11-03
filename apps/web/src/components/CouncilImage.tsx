import { cn } from "@repo/ui/lib/utils";

export function CouncilImage({ image }: { image: string }) {
  return (
    <div className="w-[100px] h-[100px] mx-auto flex items-center justify-center mb-6">
      <div className="w-full h-full border-2 border-accent rounded-full">
        <div className="relative w-full h-full rounded-full border-8 border-card">
          <div
            className={cn(
              "absolute inset-0 rounded-full",
              image ? "bg-accent" : "bg-inherit",
            )}
          />
          <div
            className={
              "absolute inset-0 w-full h-full bg-cover bg-center mb-6 grayscale opacity-60 rounded-full contrast-100"
            }
            style={{ backgroundImage: `url(${image})` }}
          />
        </div>
      </div>
    </div>
  );
}
