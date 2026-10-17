import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ReportPanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/** Surface for charts / report blocks — title lives with the content. */
export function ReportPanel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: ReportPanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_1px_2px_oklch(0.3_0.03_80/0.04)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="min-w-0 flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </div>
  );
}
