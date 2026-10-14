import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { FuelLogList } from "@/features/fuel/components/fuel-log-list";
import { FuelSummary } from "@/features/fuel/components/fuel-summary";
import { listFuelLogs } from "@/features/fuel/data";
import { refillStats, summarizeFuel } from "@/features/fuel/stats";
import { requireUser } from "@/lib/session";

export default async function FuelPage() {
  const user = await requireUser();
  const rows = await listFuelLogs(user.id);
  const refills = rows.map(({ log, transaction }) => ({
    ...log,
    amountCents: transaction.amountCents,
  }));

  return (
    <>
      <PageHeader
        title="Gasolina"
        description="Cargas, rendimiento y costo por milla"
        action={<LinkButton href="/gasolina/nueva">Nueva carga</LinkButton>}
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Sin cargas registradas"
          description="Registra cada carga con el odómetro y los galones para calcular tu rendimiento."
        />
      ) : (
        <>
          <FuelSummary summary={summarizeFuel(refills)} />
          <FuelLogList rows={rows} stats={refillStats(refills)} />
        </>
      )}
    </>
  );
}
