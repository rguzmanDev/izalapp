import { EmptyState } from "@/components/empty-state";
import { ItemLink, ItemList } from "@/components/item-list";
import { LinkButton } from "@/components/link-button";
import { PageHeader } from "@/components/page-header";
import { QuickAddButton } from "@/components/quick-add-button";
import { accountLabel } from "@/features/accounts/format";
import { getWorkingPeriod } from "@/features/periods/data";
import { listTransactions } from "@/features/transactions/data";
import { listTransfers } from "@/features/transfers/data";
import { formatMoney } from "@/lib/money";
import { formatShortDate, periodLabel, todayIsoDate } from "@/lib/period";
import { requireUser } from "@/lib/session";

type Entry = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  amountCents: number;
  occurredOn: string;
  createdAt: Date;
};

const newestFirst = (a: Entry, b: Entry) =>
  b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.getTime() - a.createdAt.getTime();

async function listEntries(userId: string, periodId: string): Promise<Entry[]> {
  const [transactionRows, transferRows] = await Promise.all([
    listTransactions(userId, periodId),
    listTransfers(userId, periodId),
  ]);

  const expenses = transactionRows.map(({ transaction, account, itemName, fuelLogId, station }) => ({
    ...transaction,
    href: fuelLogId ? `/gasolina/${fuelLogId}` : `/movimientos/${transaction.id}`,
    title: [itemName ?? "Sin presupuesto", transaction.note ?? station].filter(Boolean).join(" · "),
    subtitle: `${formatShortDate(transaction.occurredOn)} · ${accountLabel(account)}`,
  }));
  const transfers = transferRows.map(({ transfer, from, to }) => ({
    ...transfer,
    href: `/transferencias/${transfer.id}`,
    title: ["Transferencia", transfer.note].filter(Boolean).join(" · "),
    subtitle: `${formatShortDate(transfer.occurredOn)} · ${accountLabel(from)} → ${accountLabel(to)}`,
  }));

  return [...expenses, ...transfers].sort(newestFirst);
}

export default async function TransactionsPage() {
  const user = await requireUser();
  const { period, key } = await getWorkingPeriod(user.id, todayIsoDate());
  const entries = period ? await listEntries(user.id, period.id) : [];
  const isOpen = period?.status === "open";

  return (
    <>
      <PageHeader
        title="Movimientos"
        description={periodLabel(key)}
        action={
          isOpen && (
            <LinkButton href="/transferencias/nueva" variant="outline" size="sm">
              Transferir
            </LinkButton>
          )
        }
      />
      {entries.length === 0 ? (
        <EmptyState
          title="Sin movimientos"
          description={
            period
              ? "Registra tus gastos con el botón +."
              : "Abre la quincena desde Inicio para empezar a registrar gastos."
          }
        />
      ) : (
        <ItemList>
          {entries.map((entry) => (
            <ItemLink
              key={entry.id}
              href={entry.href}
              title={entry.title}
              subtitle={entry.subtitle}
              trailing={formatMoney(entry.amountCents)}
            />
          ))}
        </ItemList>
      )}
      {isOpen && <QuickAddButton />}
    </>
  );
}
