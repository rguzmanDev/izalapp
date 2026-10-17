import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { StatCard } from "@/components/stat-card";
import { listFuelLogs } from "@/features/fuel/data";
import { refillStats } from "@/features/fuel/stats";
import { AccountReportSections } from "@/features/reports/components/account-report-sections";
import { ExportCsvButton } from "@/features/reports/components/export-csv-button";
import { FuelChart } from "@/features/reports/components/fuel-chart";
import { MovementFilter } from "@/features/reports/components/movement-filter";
import { MovementReportList } from "@/features/reports/components/movement-report-list";
import { PeriodChart } from "@/features/reports/components/period-chart";
import { RangeSelector, REPORT_RANGES } from "@/features/reports/components/range-selector";
import { ReportPanel } from "@/features/reports/components/report-panel";
import {
  getAccountReports,
  getPeriodReports,
  listMovementsForPeriods,
} from "@/features/reports/data";
import { buildMovementReport, parseMovementFilter } from "@/features/reports/movement-report";
import { spentCentsOf } from "@/features/periods/summary";
import { formatMoney } from "@/lib/money";
import { formatShortDate, shortPeriodLabel, toPeriodKey } from "@/lib/period";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

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
  if (reports.length === 0) {
    return (
      <>
        <PageHeader title="Reportes" description="Cómo se usó tu dinero en las últimas quincenas" />
        <EmptyState
          title="Aún no hay datos"
          description="Los reportes aparecen cuando abres tu primera quincena."
        />
      </>
    );
  }

  const periodIds = reports.map((report) => report.period.id);
  const [movements, accountReport] = await Promise.all([
    listMovementsForPeriods(user.id, periodIds),
    getAccountReports(user.id, periodIds),
  ]);
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
  const incomeSum = sum(summaries.map((summary) => summary.incomeCents));
  const spentSum = sum(summaries.map(spentCentsOf));
  const surplusSum = sum(summaries.map((summary) => summary.actualSurplusCents));
  const overspentSum = sum(summaries.map((summary) => summary.overspentCents));
  const rangeDetail =
    reports.length === range
      ? reports.length === 1
        ? "1 quincena"
        : `${reports.length} quincenas`
      : `${reports.length} de ${range} solicitadas`;

  const periodData = reports.map(({ period, summary }) => ({
    label: shortPeriodLabel(toPeriodKey(period)),
    fixed: toDollars(summary.fixedSpentCents),
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

  const movementSummary =
    tipo === "ingresos"
      ? `${movementEntries.length} ingresos · ${formatMoney(incomeTotal)}`
      : tipo === "gastos"
        ? `${movementEntries.length} gastos · ${formatMoney(expenseTotal)}`
        : tipo === "transferencias"
          ? `${movementEntries.length} transferencias · ${formatMoney(transferTotal)}`
          : `${movementEntries.length} · ingresos ${formatMoney(incomeTotal)} · gastos ${formatMoney(expenseTotal)} · transferencias ${formatMoney(transferTotal)}`;

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Cómo se usó tu dinero en las últimas quincenas"
        action={<ExportCsvButton range={range} />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RangeSelector current={range} tipo={tipo} />
        <p className="text-xs text-muted-foreground">{rangeDetail}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ingreso" value={formatMoney(incomeSum)} detail={rangeDetail} />
        <StatCard
          label="Gastado"
          value={formatMoney(spentSum)}
          detail="Solo gastos registrados"
        />
        <div
          className={cn(
            "rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-[0_1px_2px_oklch(0.3_0.03_80/0.04)]",
            "col-span-2 sm:col-span-1",
          )}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.7rem] font-medium tracking-wide text-primary/80 uppercase">
              Sobrante
            </span>
            <span
              className={cn(
                "font-mono text-lg font-semibold tracking-tight tabular-nums select-text",
                surplusSum < 0 && "text-destructive",
              )}
            >
              {formatMoney(surplusSum)}
            </span>
          </div>
        </div>
        <StatCard
          label="Excesos"
          value={formatMoney(overspentSum)}
          detail="Por encima de lo planeado"
          negative={overspentSum > 0}
        />
      </div>

      <Section
        title="Uso por quincena"
        description="Fijos, presupuestos, otros y lo que sobró — el gráfico es el resumen del rango"
      >
        <ReportPanel
          title="Composición del gasto"
          description="Barras apiladas por quincena (montos en dólares)"
          bodyClassName="pt-2 pb-3"
        >
          <PeriodChart data={periodData} />
        </ReportPanel>
      </Section>

      {fuelData.length > 0 && (
        <ReportPanel
          title="Rendimiento de gasolina"
          description="Millas por galón en cada carga con odómetro"
          bodyClassName="pt-2 pb-3"
        >
          <FuelChart data={fuelData} />
        </ReportPanel>
      )}

      <AccountReportSections {...accountReport} />

      <Section title="Movimientos" description={movementSummary}>
        <div className="flex flex-col gap-3">
          <MovementFilter current={tipo} range={range} />
          <MovementReportList entries={movementEntries} groupByPeriod linkable={false} />
        </div>
      </Section>
    </>
  );
}
