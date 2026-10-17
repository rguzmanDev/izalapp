import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = { label: string; value: string; detail?: string; negative?: boolean };

export function StatCard({ label, value, detail, negative }: StatCardProps) {
  return (
    <Card size="sm" className="shadow-none">
      <CardContent className="flex flex-col gap-0.5">
        <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span
          className={cn(
            "font-mono text-lg font-semibold tracking-tight tabular-nums select-text",
            negative && "text-destructive",
          )}
        >
          {value}
        </span>
        {detail && <span className="text-xs text-muted-foreground select-text">{detail}</span>}
      </CardContent>
    </Card>
  );
}
