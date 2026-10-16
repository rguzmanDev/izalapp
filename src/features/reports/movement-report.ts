import type { FinancialAccount, Period, PeriodItem, Transfer } from "@/db/schema";
import { accountLabel } from "@/features/accounts/format";
import { formatShortDate, periodBounds, shortPeriodLabel, toPeriodKey } from "@/lib/period";

export const MOVEMENT_FILTERS = ["todos", "ingresos", "gastos", "transferencias"] as const;
export type MovementFilter = (typeof MOVEMENT_FILTERS)[number];

export type MovementKind = "income" | "expense" | "transfer";

export type MovementReportEntry = {
  id: string;
  kind: MovementKind;
  href: string;
  title: string;
  subtitle: string;
  amountCents: number;
  occurredOn: string;
  createdAt: Date;
};

export const MOVEMENT_KIND_LABELS: Record<MovementKind, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
};

type ExpenseRow = {
  transaction: {
    id: string;
    amountCents: number;
    occurredOn: string;
    note: string | null;
    createdAt: Date;
    periodId: string;
  };
  account: Pick<FinancialAccount, "type" | "name" | "lastFour" | "bank">;
  creditCard: Pick<FinancialAccount, "type" | "name" | "lastFour" | "bank"> | null;
  itemName: string | null;
  fuelLogId: string | null;
  station: string | null;
  period: Period;
};

type TransferRow = {
  transfer: Transfer;
  from: Pick<FinancialAccount, "type" | "name" | "lastFour" | "bank">;
  to: Pick<FinancialAccount, "type" | "name" | "lastFour" | "bank">;
  period: Period;
};

type IncomeRow = {
  item: PeriodItem;
  account: Pick<FinancialAccount, "type" | "name" | "lastFour" | "bank">;
  period: Period;
};

const newestFirst = (a: MovementReportEntry, b: MovementReportEntry) =>
  b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.getTime() - a.createdAt.getTime();

export function buildMovementReport(
  expenseRows: ExpenseRow[],
  transferRows: TransferRow[],
  incomeRows: IncomeRow[],
  filter: MovementFilter = "todos",
): MovementReportEntry[] {
  const expenses: MovementReportEntry[] = expenseRows.map(
    ({ transaction, account, creditCard, itemName, fuelLogId, station, period }) => {
      const payWith = creditCard
        ? `${accountLabel(account)} · ${accountLabel(creditCard)}`
        : accountLabel(account);
      return {
        id: transaction.id,
        kind: "expense" as const,
        href: fuelLogId ? `/gasolina/${fuelLogId}` : `/movimientos/${transaction.id}`,
        title: [itemName ?? "Sin presupuesto", transaction.note ?? station]
          .filter(Boolean)
          .join(" · "),
        subtitle: `${shortPeriodLabel(toPeriodKey(period))} · ${formatShortDate(transaction.occurredOn)} · ${payWith}`,
        amountCents: transaction.amountCents,
        occurredOn: transaction.occurredOn,
        createdAt: transaction.createdAt,
      };
    },
  );

  const transfers: MovementReportEntry[] = transferRows.map(({ transfer, from, to, period }) => ({
    id: transfer.id,
    kind: "transfer",
    href: `/transferencias/${transfer.id}`,
    title: ["Transferencia", transfer.note].filter(Boolean).join(" · "),
    subtitle: `${shortPeriodLabel(toPeriodKey(period))} · ${formatShortDate(transfer.occurredOn)} · ${accountLabel(from)} → ${accountLabel(to)}`,
    amountCents: transfer.amountCents,
    occurredOn: transfer.occurredOn,
    createdAt: transfer.createdAt,
  }));

  const incomes: MovementReportEntry[] = incomeRows.map(({ item, account, period }) => {
    const key = toPeriodKey(period);
    const { start } = periodBounds(key);
    return {
      id: item.id,
      kind: "income" as const,
      href: `/partidas/${item.id}`,
      title: item.name,
      subtitle: `${shortPeriodLabel(key)} · ${formatShortDate(start)} · ${accountLabel(account)}`,
      amountCents: item.plannedCents,
      occurredOn: start,
      createdAt: item.createdAt,
    };
  });

  const all = [...incomes, ...expenses, ...transfers].sort(newestFirst);
  if (filter === "ingresos") return all.filter((entry) => entry.kind === "income");
  if (filter === "gastos") return all.filter((entry) => entry.kind === "expense");
  if (filter === "transferencias") return all.filter((entry) => entry.kind === "transfer");
  return all;
}

export function parseMovementFilter(value: string | string[] | undefined): MovementFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return MOVEMENT_FILTERS.includes(raw as MovementFilter) ? (raw as MovementFilter) : "todos";
}
