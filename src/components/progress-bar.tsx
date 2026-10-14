import { cn } from "@/lib/utils";

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : value > 0 ? 100 : 0;
  const exceeded = value > max;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn("h-full rounded-full bg-primary", exceeded && "bg-destructive")}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
