import { EmptyState } from "@/components/empty-state";
import { ConfirmForm } from "@/components/form/confirm-form";
import { PendingButton } from "@/components/form/pending-button";
import { LinkButton } from "@/components/link-button";
import { openCurrentPeriod } from "../actions";

export function OpenPeriodPrompt({ hasIncome }: { hasIncome: boolean }) {
  if (!hasIncome) {
    return (
      <EmptyState
        title="Configura tu plan"
        description="Empieza por tus cuentas, luego registra tu ingreso, tus gastos fijos y tus presupuestos."
        action={<LinkButton href="/ajustes">Ir a ajustes</LinkButton>}
      />
    );
  }

  return (
    <EmptyState
      title="Quincena sin abrir"
      description="Al abrirla se copian tu ingreso, gastos fijos y presupuestos activos para esta quincena."
      action={
        <ConfirmForm
          action={openCurrentPeriod}
          confirmMessage="¿Abrir esta quincena? Se copiarán tus ingresos, gastos fijos y presupuestos activos."
        >
          <PendingButton size="lg" className="h-10">
            Abrir quincena
          </PendingButton>
        </ConfirmForm>
      }
    />
  );
}
