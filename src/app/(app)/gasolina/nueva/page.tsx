import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toAccountOptions } from "@/features/accounts/format";
import { saveFuelLog } from "@/features/fuel/actions";
import { FuelForm } from "@/features/fuel/components/fuel-form";
import { listFuelLogs } from "@/features/fuel/data";
import { OpenPeriodPrompt } from "@/features/periods/components/open-period-prompt";
import { ClosedPeriodNotice } from "@/features/periods/components/period-notices";
import { findPeriod, listPeriodItems } from "@/features/periods/data";
import { toItemOptions } from "@/features/transactions/format";
import { periodKeyOf, todayIsoDate } from "@/lib/period";
import { requireUser } from "@/lib/session";

export default async function NewFuelLogPage({ searchParams }: PageProps<"/gasolina/nueva">) {
  const { partida } = await searchParams;
  const user = await requireUser();
  const today = todayIsoDate();
  const period = await findPeriod(user.id, periodKeyOf(today));
  const header = <PageHeader title="Nueva carga" backHref="/gasolina" />;

  if (!period || period.status === "closed") {
    return (
      <>
        {header}
        {period ? <ClosedPeriodNotice periodId={period.id} /> : <OpenPeriodPrompt hasIncome />}
      </>
    );
  }

  const [rows, accounts, refills] = await Promise.all([
    listPeriodItems(user.id, period.id),
    listAccounts(user.id),
    listFuelLogs(user.id),
  ]);
  const items = rows.map((row) => row.item);
  const fuelItemId = items.find((item) => item.isFuel)?.id;

  return (
    <>
      {header}
      <FuelForm
        action={saveFuelLog.bind(null, null)}
        defaultItemId={typeof partida === "string" ? partida : fuelItemId}
        defaultDate={today}
        lastOdometer={refills.at(-1)?.log.odometer ?? null}
        itemOptions={toItemOptions(items)}
        accountOptions={toAccountOptions(accounts)}
      />
    </>
  );
}
