import { ItemLink, ItemList } from "@/components/item-list";
import { formatMoney } from "@/lib/money";
import { formatShortDate } from "@/lib/period";
import type { FuelLogRow } from "../data";
import { formatGallons, formatMiles, formatMpg, formatPricePerGallon } from "../format";
import type { RefillStats } from "../stats";

type FuelLogListProps = { rows: FuelLogRow[]; stats: RefillStats[] };

/** Newest refill first. `rows` and `stats` come sorted by odometer, lowest first. */
export function FuelLogList({ rows, stats }: FuelLogListProps) {
  const entries = rows.map((row, index) => ({ ...row, stats: stats[index] })).reverse();

  return (
    <ItemList>
      {entries.map(({ log, transaction, stats }) => {
        const title = [formatShortDate(transaction.occurredOn), log.station].filter(Boolean);
        const details = [
          formatMiles(log.odometer),
          `${formatGallons(log.gallons)} a ${formatPricePerGallon(log.pricePerGallon)}`,
          !log.isFullTank && "parcial",
        ].filter(Boolean);
        return (
          <ItemLink
            key={log.id}
            href={`/gasolina/${log.id}`}
            title={title.join(" · ")}
            subtitle={details.join(" · ")}
            trailing={
              <div className="flex flex-col">
                <span>{formatMoney(transaction.amountCents)}</span>
                {stats.milesPerGallon !== null && (
                  <span className="text-xs text-muted-foreground">
                    {formatMpg(stats.milesPerGallon)}
                  </span>
                )}
              </div>
            }
          />
        );
      })}
    </ItemList>
  );
}
