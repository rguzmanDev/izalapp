import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  backHref?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, backHref, action }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeftIcon className="size-4" />
            Volver
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}
