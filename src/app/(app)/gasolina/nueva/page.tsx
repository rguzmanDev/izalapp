import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toCardOptionsByFundingAccount, toMoneyAccountOptions } from "@/features/accounts/format";
import { saveFuelLog } from "@/features/fuel/actions";
import { FuelForm } from "@/features/fuel/components/fuel-form";
import { listFuelLogs } from "@/features/fuel/data";
import { OpenPeriodPrompt } from "@/features/periods/components/open-period-prompt";
import { ClosedPeriodNotice } from "@/features/periods/components/period-notices";
import { getWorkingPeriod, listPeriodItems } from "@/features/periods/data";
import { toFuelItemOptions } from "@/features/transactions/format";
import { todayIsoDate } from "@/lib/period";
import { requireUser } from "@/lib/session";

export default async function NewFuelLogPage({ searchParams }: PageProps<"/gasolina/nueva">) {
  const { partida } = await searchParams;
  const user = await requireUser();
  const today = todayIsoDate();
  const { period } = await getWorkingPeriod(user.id, today);
  const header = <PageHeader title="Nueva carga" backHref="/gasolina" />;

  if (!period || period.status === "closed") {
    return (
      <>
        {header}
        {period ? <ClosedPeriodNotice periodId={period.id} /> : <OpenPeriodPrompt hasIncome />}
      </>
    );
  }

  const [rows, refills, accounts] = await Promise.all([
    listPeriodItems(user.id, period.id),
    listFuelLogs(user.id),
    listAccounts(user.id),
  ]);
  const items = rows.map((row) => row.item);
  const itemOptions = toFuelItemOptions(items);
  const hasFuelBudget = items.some((item) => item.kind === "budget" && item.isFuel);
  const requestedId = typeof partida === "string" ? partida : undefined;
  const defaultItemId =
    requestedId && itemOptions.some((option) => option.value === requestedId)
      ? requestedId
      : itemOptions[0]?.value;

  if (itemOptions.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          title={hasFuelBudget ? "Presupuesto de gasolina sin fondear" : "Falta un presupuesto de gasolina"}
          description={
            hasFuelBudget
              ? "Aparta el presupuesto o completa el fondeo de su cuenta antes de registrar cargas."
              : "Marca un presupuesto como gasolina en Ajustes para poder registrar cargas."
          }
          action={
            <LinkButton href={hasFuelBudget ? "/" : "/presupuestos"}>
              {hasFuelBudget ? "Ir a Inicio" : "Ir a presupuestos"}
            </LinkButton>
          }
        />
      </>
    );
  }

  return (
    <>
      {header}
      <FuelForm
        action={saveFuelLog.bind(null, null)}
        defaultItemId={defaultItemId}
        defaultDate={today}
        lastOdometer={refills.at(-1)?.log.odometer ?? null}
        itemOptions={itemOptions}
        accountOptions={toMoneyAccountOptions(accounts)}
        cardOptionsByAccount={toCardOptionsByFundingAccount(accounts)}
      />
    </>
  );
}
