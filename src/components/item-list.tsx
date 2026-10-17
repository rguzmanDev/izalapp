import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ItemList({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y divide-border/80 overflow-hidden rounded-xl border border-border/80 bg-card">
      {children}
    </ul>
  );
}

type ItemLinkProps = {
  href: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  muted?: boolean;
  /** Rows usually show the user's data; turn it off for app navigation such as settings. */
  selectable?: boolean;
};

export function ItemLink({ href, title, subtitle, trailing, muted, selectable = true }: ItemLinkProps) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
          muted && "opacity-60",
        )}
      >
        <div className={cn("flex min-w-0 flex-1 flex-col", selectable && "select-text")}>
          <span className="truncate font-medium">{title}</span>
          {subtitle && (
            <span className="line-clamp-2 text-sm text-muted-foreground">{subtitle}</span>
          )}
        </div>
        {trailing && (
          <div className={cn("text-right text-sm tabular-nums", selectable && "select-text")}>
            {trailing}
          </div>
        )}
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}
