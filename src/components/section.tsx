import type { ReactNode } from "react";

type SectionProps = { title: string; action?: ReactNode; children: ReactNode };

export function Section({ title, action, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
