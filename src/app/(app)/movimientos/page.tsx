import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { QuickAddButton } from "@/components/quick-add-button";
import { getWorkingPeriod } from "@/features/periods/data";
import { MovementFilterBar } from "@/features/reports/components/movement-filter";
import { MovementReportList } from "@/features/reports/components/movement-report-list";
import { listMovementsForPeriods } from "@/features/reports/data";
import {
  buildMovementReport,
  parseMovementFilter,
  type MovementFilter,
} from "@/features/reports/movement-report";
import { formatMoney } from "@/lib/money";
import { periodLabel, todayIsoDate } from "@/lib/period";
import { requireUser } from "@/lib/session";

export default async function TransactionsPage({
  searchParams,
}: PageProps<"/movimientos">) {
  const params = await searchParams;
  const tipo = parseMovementFilter(params.tipo);
  const user = await requireUser();
  const { period, key } = await getWorkingPeriod(user.id, todayIsoDate());
  const isOpen = period?.status === "open";

  const movements = period
    ? await listMovementsForPeriods(user.id, [period.id])
    : { expenses: [], transfers: [], incomes: [] };
  const entries = buildMovementReport(
    movements.expenses,
    movements.transfers,
    movements.incomes,
    tipo,
  );

  const totalOf = (kind: "income" | "expense" | "transfer") =>
    entries
      .filter((entry) => entry.kind === kind)
      .reduce((sum, entry) => sum + entry.amountCents, 0);

  const filterSummary =
    tipo === "ingresos"
      ? `${entries.length} ingresos · ${formatMoney(totalOf("income"))}`
      : tipo === "gastos"
        ? `${entries.length} gastos · ${formatMoney(totalOf("expense"))}`
        : tipo === "transferencias"
          ? `${entries.length} transferencias · ${formatMoney(totalOf("transfer"))}`
          : `${entries.length} · ingresos ${formatMoney(totalOf("income"))} · gastos ${formatMoney(totalOf("expense"))} · transferencias ${formatMoney(totalOf("transfer"))}`;

  const hrefFor = (filter: MovementFilter) =>
    filter === "todos" ? "/movimientos" : `/movimientos?tipo=${filter}`;

  return (
    <>
      <PageHeader
        title="Movimientos"
        description={periodLabel(key)}
        action={
          isOpen && (
            <LinkButton href="/transferencias/nueva" variant="outline" size="sm">
              Transferir
            </LinkButton>
          )
        }
      />
      {!period ? (
        <EmptyState
          title="Sin movimientos"
          description="Abre la quincena desde Inicio para empezar a registrar movimientos."
        />
      ) : (
        <div className="flex flex-col gap-3">
          <MovementFilterBar current={tipo} hrefFor={hrefFor} />
          <p className="text-xs text-muted-foreground">{filterSummary}</p>
          {movements.expenses.length === 0 &&
          movements.transfers.length === 0 &&
          movements.incomes.length === 0 ? (
            <EmptyState
              title="Sin movimientos"
              description="Registra gastos con el botón +, transferencias o un ingreso extra desde Inicio."
            />
          ) : (
            <MovementReportList entries={entries} />
          )}
        </div>
      )}
      {isOpen && <QuickAddButton />}
    </>
  );
}
