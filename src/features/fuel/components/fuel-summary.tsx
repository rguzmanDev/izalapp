import { StatCard } from "@/components/stat-card";
import { formatMoney } from "@/lib/money";
import { formatMiles, formatMpg } from "../format";
import type { FuelSummary as Summary } from "../stats";

const NOT_ENOUGH_DATA = "—";

export function FuelSummary({ summary }: { summary: Summary }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Rendimiento"
        value={
          summary.averageMilesPerGallon === null
            ? NOT_ENOUGH_DATA
            : formatMpg(summary.averageMilesPerGallon)
        }
        detail={summary.averageMilesPerGallon === null ? "Necesita 2 tanques llenos" : undefined}
      />
      <StatCard
        label="Costo por milla"
        value={
          summary.costPerMileCents === null ? NOT_ENOUGH_DATA : formatMoney(summary.costPerMileCents)
        }
      />
      <StatCard
        label="Odómetro"
        value={summary.lastOdometer === null ? NOT_ENOUGH_DATA : formatMiles(summary.lastOdometer)}
      />
      <StatCard
        label="Precio promedio"
        value={
          summary.averagePricePerGallonCents === null
            ? NOT_ENOUGH_DATA
            : `${formatMoney(summary.averagePricePerGallonCents)}/gal`
        }
      />
    </div>
  );
}
