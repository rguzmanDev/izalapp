import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form/delete-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toAccountOptions } from "@/features/accounts/format";
import { removeFuelLog, saveFuelLog } from "@/features/fuel/actions";
import { FuelForm } from "@/features/fuel/components/fuel-form";
import { getFuelLog } from "@/features/fuel/data";
import { listPeriodItems } from "@/features/periods/data";
import { toItemOptions } from "@/features/transactions/format";
import { formatShortDate } from "@/lib/period";
import { requireUser } from "@/lib/session";

export default async function EditFuelLogPage({ params }: PageProps<"/gasolina/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const row = await getFuelLog(user.id, id);
  if (!row) notFound();

  const [items, accounts] = await Promise.all([
    listPeriodItems(user.id, row.transaction.periodId),
    listAccounts(user.id),
  ]);

  return (
    <>
      <PageHeader
        title={`Carga del ${formatShortDate(row.transaction.occurredOn)}`}
        backHref="/gasolina"
      />
      <FuelForm
        action={saveFuelLog.bind(null, row.log.id)}
        row={row}
        defaultDate={row.transaction.occurredOn}
        lastOdometer={null}
        itemOptions={toItemOptions(items.map((item) => item.item))}
        accountOptions={toAccountOptions(accounts)}
      />
      <DeleteButton
        action={removeFuelLog.bind(null, row.log.id)}
        confirmMessage="¿Eliminar esta carga?"
      />
    </>
  );
}
