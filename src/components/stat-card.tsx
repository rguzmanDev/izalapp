import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = { label: string; value: string; detail?: string; negative?: boolean };

export function StatCard({ label, value, detail, negative }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span
          className={cn(
            "text-lg font-semibold tabular-nums select-text",
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
