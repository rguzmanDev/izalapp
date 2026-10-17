import type { ReactNode } from "react";
import { ConfirmForm } from "@/components/form/confirm-form";
import { PendingButton } from "@/components/form/pending-button";
import { LinkButton } from "@/components/link-button";
import type { Period } from "@/db/schema";
import { periodLabel, toPeriodKey } from "@/lib/period";
import { cn } from "@/lib/utils";
import { reopenPeriodAction } from "../actions";

type NoticeProps = {
  title: string;
  description: string;
  action: ReactNode;
  /** Flat look when nested inside PeriodHero. */
  embedded?: boolean;
};

function Notice({ title, description, action, embedded }: NoticeProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        embedded
          ? "py-0"
          : "rounded-xl border border-border/80 bg-card px-4 py-3",
      )}
    >
      <div className="flex min-w-0 flex-col">
        <span className="font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      {action}
    </div>
  );
}

export function StalePeriodNotice({
  period,
  embedded,
}: {
  period: Period;
  embedded?: boolean;
}) {
  return (
    <Notice
      embedded={embedded}
      title={`Sigue el corte de la ${periodLabel(toPeriodKey(period))}`}
      description="Hasta que la cierres, todos los movimientos van aquí. Luego abres la siguiente."
      action={
        <LinkButton href={`/quincenas/${period.id}/cerrar`} size="sm">
          Cerrar
        </LinkButton>
      }
    />
  );
}

export function ClosedPeriodNotice({
  periodId,
  embedded,
}: {
  periodId: string;
  embedded?: boolean;
}) {
  return (
    <Notice
      embedded={embedded}
      title="Quincena cerrada"
      description="Al reabrirla se quita el traspaso del sobrante."
      action={
        <ConfirmForm
          action={reopenPeriodAction.bind(null, periodId)}
          confirmMessage="¿Reabrir la quincena? Se quitará el traspaso del sobrante."
        >
          <PendingButton variant="outline" className="h-10">
            Reabrir
          </PendingButton>
        </ConfirmForm>
      }
    />
  );
}
