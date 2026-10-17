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
import { ReportStory } from "@/features/reports/components/report-story";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Reportes"
          description="Cómo se usó tu dinero en las últimas quincenas"
        />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <RangeSelector current={range} tipo={tipo} />
          <ExportCsvButton range={range} />
        </div>
      </div>

      <ReportStory summaries={summaries} rangeLabel={rangeDetail} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Ingreso" value={formatMoney(incomeSum)} />
        <StatCard label="Gastado" value={formatMoney(spentSum)} />
        <StatCard
          label="Sobrante"
          value={formatMoney(surplusSum)}
          negative={surplusSum < 0}
        />
        <StatCard
          label="Excesos"
          value={formatMoney(overspentSum)}
          negative={overspentSum > 0}
        />
      </div>

      <div className={fuelData.length > 0 ? "grid gap-4 lg:grid-cols-5" : undefined}>
        <ReportPanel
          title="Uso por quincena"
          description="Fijos, presupuestos, otros y sobrante"
          className={fuelData.length > 0 ? "lg:col-span-3" : undefined}
          bodyClassName="pt-2 pb-3"
        >
          <PeriodChart data={periodData} />
        </ReportPanel>
        {fuelData.length > 0 && (
          <ReportPanel
            title="Gasolina"
            description="mi/gal por carga"
            className="lg:col-span-2"
            bodyClassName="pt-2 pb-3"
          >
            <FuelChart data={fuelData} />
          </ReportPanel>
        )}
      </div>

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
