import type { ReactNode } from "react";
import { ConfirmForm } from "@/components/form/confirm-form";
import { PendingButton } from "@/components/form/pending-button";
import { LinkButton } from "@/components/link-button";
import type { Period } from "@/db/schema";
import { periodLabel, toPeriodKey } from "@/lib/period";
import { reopenPeriodAction } from "../actions";

type NoticeProps = { title: string; description: string; action: ReactNode };

function Notice({ title, description, action }: NoticeProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <div className="flex min-w-0 flex-col">
        <span className="font-medium">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
      {action}
    </div>
  );
}

export function StalePeriodNotice({ period }: { period: Period }) {
  return (
    <Notice
      title={`La ${periodLabel(toPeriodKey(period))} sigue abierta`}
      description="Ciérrala para decidir qué hacer con su sobrante."
      action={
        <LinkButton href={`/quincenas/${period.id}/cerrar`} size="sm">
          Cerrar
        </LinkButton>
      }
    />
  );
}

export function ClosedPeriodNotice({ periodId }: { periodId: string }) {
  return (
    <Notice
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
