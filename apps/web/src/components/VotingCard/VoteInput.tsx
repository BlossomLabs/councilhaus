import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";

export function VoteInput({
  value,
  onChange,
  max,
  min = 0,
  total,
  increment,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  max: number;
  min?: number;
  total: number;
  increment: number;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center">
      <Button
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - increment))}
        className="bg-gray-700 w-8 py-1 text-white hover:bg-gray-500 rounded-r-none"
      >
        -
      </Button>
      <Input
        disabled={disabled}
        type="number"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(
            Math.max(min, Math.min(max, Number.parseInt(e.target.value) || 0)),
          )
        }
        className="w-16 bg-gray-600 text-center text-white rounded-none px-3 py-1 input-number-hide-arrows border-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-default"
      />
      <Button
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + increment))}
        className="bg-gray-700 w-8 py-1 text-white hover:bg-gray-500 rounded-l-none"
      >
        +
      </Button>
      <span className="w-12 text-right hidden sm:block">
        {value > 0 ? Math.round((value / total) * 100) : 0}%
      </span>
    </div>
  );
}
