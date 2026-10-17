import Link from "next/link";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { QuickAddButton } from "@/components/quick-add-button";
import { Section } from "@/components/section";
import { CardStatementList } from "@/features/cards/components/card-statement-list";
import { listCardStatements } from "@/features/cards/data";
import { BudgetList } from "@/features/periods/components/budget-list";
import { FixedExpenseList } from "@/features/periods/components/fixed-expense-list";
import { IncomeList } from "@/features/periods/components/income-list";
import { OpenPeriodPrompt } from "@/features/periods/components/open-period-prompt";
import { PeriodHero } from "@/features/periods/components/period-hero";
import { ClosedPeriodNotice, StalePeriodNotice } from "@/features/periods/components/period-notices";
import { PeriodSummary } from "@/features/periods/components/period-summary";
import {
  getUnbudgetedSpent,
  getWorkingPeriod,
  listPeriodItems,
} from "@/features/periods/data";
import { summarizePeriod } from "@/features/periods/summary";
import { getActiveTemplates } from "@/features/plan/data";
import { FundingHelp } from "@/features/transfers/components/funding-help";
import { TransferPlanList } from "@/features/transfers/components/transfer-plan-list";
import { getTransferPlan } from "@/features/transfers/data";
import { UpcomingPayments } from "@/features/upcoming/components/upcoming-payments";
import { periodLabel, periodRangeLabel, todayIsoDate } from "@/lib/period";
import { requireUser } from "@/lib/session";

export default async function HomePage() {
  const user = await requireUser();
  const today = todayIsoDate();
  const { period, key, isStale } = await getWorkingPeriod(user.id, today);

  if (!period) {
    const templates = await getActiveTemplates(user.id);
    return (
      <>
        <PageHeader title={periodLabel(key)} description={periodRangeLabel(key)} />
        <OpenPeriodPrompt hasIncome={templates.incomes.length > 0} />
      </>
    );
  }

  const [rows, unbudgetedCents, transferPlan, cardStatements] = await Promise.all([
    listPeriodItems(user.id, period.id),
    getUnbudgetedSpent(user.id, period.id),
    getTransferPlan(user.id, period.id),
    listCardStatements(user.id, today),
  ]);
  const incomes = rows.filter((row) => row.item.kind === "income");
  const budgets = rows.filter((row) => row.item.kind === "budget");
  const fixedExpenses = rows.filter((row) => row.item.kind === "fixed_expense");
  const isClosed = period.status === "closed";
  const hasFuelBudget = budgets.some((row) => row.item.isFuel);
  const summary = summarizePeriod(rows, unbudgetedCents);

  const notice = isStale ? (
    <StalePeriodNotice period={period} embedded />
  ) : isClosed ? (
    <ClosedPeriodNotice periodId={period.id} embedded />
  ) : null;

  return (
    <>
      <PeriodHero periodKey={key} today={today} closed={isClosed} notice={notice}>
        <PeriodSummary summary={summary} closed={isClosed} />
      </PeriodHero>

      <UpcomingPayments fixedExpenses={isClosed ? [] : fixedExpenses} today={today} />

      {transferPlan.steps.length > 0 && (
        <Section title="Fondear cuentas" description={<FundingHelp />}>
          <TransferPlanList
            periodId={period.id}
            steps={transferPlan.steps}
            accounts={transferPlan.accounts}
            readOnly={isClosed}
          />
        </Section>
      )}

      {cardStatements.length > 0 && (
        <Section
          title="Tarjetas"
          description="Compra → baja la cuenta fondeadora y sube el «por pagar». Registrar pago → solo marca liquidación."
        >
          <CardStatementList statements={cardStatements} today={today} />
        </Section>
      )}

      {(budgets.length > 0 || fixedExpenses.length > 0) && (
        <div
          className={
            budgets.length > 0 && fixedExpenses.length > 0
              ? "grid gap-6 lg:grid-cols-2 lg:items-start"
              : "flex flex-col gap-6"
          }
        >
          {budgets.length > 0 && (
            <Section title="Presupuestos">
              <BudgetList rows={budgets} readOnly={isClosed} />
            </Section>
          )}
          {fixedExpenses.length > 0 && (
            <Section title="Gastos fijos">
              <FixedExpenseList rows={fixedExpenses} today={today} readOnly={isClosed} />
            </Section>
          )}
        </div>
      )}

      {(incomes.length > 0 || !isClosed) && (
        <Section
          title="Ingresos"
          action={
            !isClosed && (
              <Link
                href={`/quincenas/${period.id}/ingreso-extra`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                + Ingreso extra
              </Link>
            )
          }
        >
          {incomes.length > 0 ? (
            <IncomeList rows={incomes} readOnly={isClosed} />
          ) : (
            <p className="text-sm text-muted-foreground">Aún no hay ingresos en esta quincena.</p>
          )}
        </Section>
      )}

      {!isClosed && (
        <>
          <LinkButton href={`/quincenas/${period.id}/cerrar`} variant="outline">
            Cerrar quincena
          </LinkButton>
          <QuickAddButton fuelHref={hasFuelBudget ? "/gasolina/nueva" : undefined} />
        </>
      )}
    </>
  );
}
