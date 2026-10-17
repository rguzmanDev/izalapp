import type { ReactNode } from "react";

type SectionProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

export function Section({ title, description, action, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-0.5">
          <h2 className="font-heading text-base font-semibold tracking-[-0.01em] text-foreground">
            {title}
          </h2>
          {description &&
            (typeof description === "string" ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : (
              description
            ))}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
