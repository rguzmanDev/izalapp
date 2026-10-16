import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { PlanTable } from "@/features/plan/components/plan-table";
import { getMonthlyPlan } from "@/features/plan/data";
import { requireUser } from "@/lib/session";

export default async function PlanPage() {
  const user = await requireUser();
  const plan = await getMonthlyPlan(user.id);

  return (
    <>
      <PageHeader
        title="Plan mensual"
        description="Ingresos, gastos fijos y presupuestos activos repartidos entre el pago del 15 y el del 30"
        backHref="/ajustes"
      />
      {plan.incomes.lines.length > 0 ? (
        <PlanTable plan={plan} />
      ) : (
        <EmptyState
          title="Configura tu plan"
          description="Empieza por tus cuentas, luego registra tu ingreso, tus gastos fijos y tus presupuestos."
          action={<LinkButton href="/ajustes">Ir a ajustes</LinkButton>}
        />
      )}
    </>
  );
}
