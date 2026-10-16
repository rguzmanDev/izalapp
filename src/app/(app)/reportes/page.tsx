import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { StatCard } from "@/components/stat-card";
import { listFuelLogs } from "@/features/fuel/data";
import { refillStats } from "@/features/fuel/stats";
import { buildBudgetReport } from "@/features/reports/budget-report";
import { BudgetReportTable } from "@/features/reports/components/budget-report-table";
import { FuelChart } from "@/features/reports/components/fuel-chart";
import { MovementFilter } from "@/features/reports/components/movement-filter";
import { MovementReportList } from "@/features/reports/components/movement-report-list";
import { PeriodChart } from "@/features/reports/components/period-chart";
import { RangeSelector, REPORT_RANGES } from "@/features/reports/components/range-selector";
import { getPeriodReports, listMovementsForPeriods } from "@/features/reports/data";
import { buildMovementReport, parseMovementFilter } from "@/features/reports/movement-report";
import { formatMoney } from "@/lib/money";
import { formatShortDate, shortPeriodLabel, toPeriodKey } from "@/lib/period";
import { requireUser } from "@/lib/session";

const toDollars = (cents: number) => Math.round(cents) / 100;
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function parseRange(value: string | string[] | undefined): number {
  const range = Number(value);
  return REPORT_RANGES.find((option) => option === range) ?? REPORT_RANGES[0];
}

export default async function ReportsPage({ searchParams }: PageProps<"/reportes">) {
  const params = await searchParams;
  const range = parseRange(params.quincenas);
  const tipo = parseMovementFilter(params.tipo);
  const user = await requireUser();
  const [reports, refills] = await Promise.all([
    getPeriodReports(user.id, range),
    listFuelLogs(user.id),
  ]);
  const header = (
    <PageHeader title="Reportes" description="Cómo se usó tu dinero en las últimas quincenas" />
  );

  if (reports.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title="Aún no hay datos"
          description="Los reportes aparecen cuando abres tu primera quincena."
        />
      </>
    );
  }

  const periodIds = reports.map((report) => report.period.id);
  const movements = await listMovementsForPeriods(user.id, periodIds);
  const movementEntries = buildMovementReport(
    movements.expenses,
    movements.transfers,
    movements.incomes,
    tipo,
  );
  const totalOf = (kind: "income" | "expense" | "transfer") =>
    movementEntries
      .filter((entry) => entry.kind === kind)
      .reduce((total, entry) => total + entry.amountCents, 0);
  const incomeTotal = totalOf("income");
  const expenseTotal = totalOf("expense");
  const transferTotal = totalOf("transfer");

  const summaries = reports.map((report) => report.summary);
  const spentCents = (summary: (typeof summaries)[number]) =>
    summary.fixedCommittedCents + summary.budgetSpentCents + summary.unbudgetedCents;

  const periodData = reports.map(({ period, summary }) => ({
    label: shortPeriodLabel(toPeriodKey(period)),
    fixed: toDollars(summary.fixedCommittedCents),
    budgets: toDollars(summary.budgetSpentCents),
    other: toDollars(summary.unbudgetedCents),
    surplus: toDollars(Math.max(0, summary.actualSurplusCents)),
  }));

  const fuelStats = refillStats(
    refills.map(({ log, transaction }) => ({ ...log, amountCents: transaction.amountCents })),
  );
  const fuelData = refills.flatMap(({ transaction }, index) => {
    const mpg = fuelStats[index].milesPerGallon;
    return mpg === null
      ? []
      : [{ label: formatShortDate(transaction.occurredOn), mpg: Math.round(mpg * 10) / 10 }];
  });

  const budgetLines = buildBudgetReport(reports);

  return (
    <>
      {header}
      <RangeSelector current={range} tipo={tipo} />
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Ingreso"
          value={formatMoney(sum(summaries.map((summary) => summary.incomeCents)))}
          detail={reports.length === 1 ? "1 quincena" : `${reports.length} quincenas`}
        />
        <StatCard label="Gastado" value={formatMoney(sum(summaries.map(spentCents)))} />
        <StatCard
          label="Sobrante"
          value={formatMoney(sum(summaries.map((summary) => summary.actualSurplusCents)))}
          detail={`Ahorrado al cerrar ${formatMoney(sum(reports.map((report) => report.savedCents)))}`}
        />
        <StatCard
          label="Excesos"
          value={formatMoney(sum(summaries.map((summary) => summary.overspentCents)))}
          detail="Gastado por encima de lo planeado"
          negative={summaries.some((summary) => summary.overspentCents > 0)}
        />
      </div>
      <Section
        title="Movimientos"
        description={
          tipo === "ingresos"
            ? `${movementEntries.length} ingresos · ${formatMoney(incomeTotal)}`
            : tipo === "gastos"
              ? `${movementEntries.length} gastos · ${formatMoney(expenseTotal)}`
              : tipo === "transferencias"
                ? `${movementEntries.length} transferencias · ${formatMoney(transferTotal)}`
                : `${movementEntries.length} · ingresos ${formatMoney(incomeTotal)} · gastos ${formatMoney(expenseTotal)} · transferencias ${formatMoney(transferTotal)}`
        }
      >
        <div className="flex flex-col gap-3">
          <MovementFilter current={tipo} range={range} />
          <MovementReportList entries={movementEntries} />
        </div>
      </Section>
      <Section title="Por quincena">
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <PeriodChart data={periodData} />
        </div>
      </Section>
      {budgetLines.length > 0 && (
        <Section title="Presupuestos">
          <BudgetReportTable lines={budgetLines} />
        </Section>
      )}
      {fuelData.length > 0 && (
        <Section title="Rendimiento de gasolina">
          <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <FuelChart data={fuelData} />
          </div>
        </Section>
      )}
    </>
  );
}
