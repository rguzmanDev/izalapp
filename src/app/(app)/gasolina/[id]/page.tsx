import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form/delete-button";
import { PageHeader } from "@/components/page-header";
import { removeFuelLog, saveFuelLog } from "@/features/fuel/actions";
import { FuelForm } from "@/features/fuel/components/fuel-form";
import { getFuelLog } from "@/features/fuel/data";
import { listPeriodItems } from "@/features/periods/data";
import { toFuelItemOptions } from "@/features/transactions/format";
import { formatShortDate } from "@/lib/period";
import { requireUser } from "@/lib/session";

export default async function EditFuelLogPage({ params }: PageProps<"/gasolina/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const row = await getFuelLog(user.id, id);
  if (!row) notFound();

  const items = await listPeriodItems(user.id, row.transaction.periodId);
  const itemOptions = toFuelItemOptions(
    items.map((item) => item.item),
    { includeId: row.transaction.itemId },
  );

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
        itemOptions={itemOptions}
      />
      <DeleteButton
        action={removeFuelLog.bind(null, row.log.id)}
        confirmMessage="¿Eliminar esta carga?"
      />
    </>
  );
}
