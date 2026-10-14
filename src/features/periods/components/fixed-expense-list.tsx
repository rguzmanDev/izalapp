import Link from "next/link";
import { PendingButton } from "@/components/form/pending-button";
import { Badge } from "@/components/ui/badge";
import { accountLabel } from "@/features/accounts/format";
import { formatMoney } from "@/lib/money";
import { setPaymentStatus } from "../actions";
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from "../constants";
import type { PeriodItemRow } from "../data";

const NEXT_ACTIONS: Record<PaymentStatus, { status: PaymentStatus; label: string }[]> = {
  pending: [
    { status: "set_aside", label: "Apartar" },
    { status: "paid", label: "Pagar" },
  ],
  set_aside: [
    { status: "paid", label: "Pagar" },
    { status: "pending", label: "Deshacer" },
  ],
  paid: [{ status: "set_aside", label: "Deshacer" }],
};

const BADGE_VARIANTS: Record<PaymentStatus, "outline" | "secondary" | "default"> = {
  pending: "outline",
  set_aside: "secondary",
  paid: "default",
};

type FixedExpenseRowProps = PeriodItemRow & { readOnly?: boolean };

function FixedExpenseRow({ item, account, readOnly }: FixedExpenseRowProps) {
  const details = [item.dueDay && `día ${item.dueDay}`, accountLabel(account)].filter(Boolean);

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col select-text">
          {readOnly ? (
            <span className="truncate font-medium">{item.name}</span>
          ) : (
            <Link href={`/partidas/${item.id}`} className="truncate font-medium hover:underline">
              {item.name}
            </Link>
          )}
          <span className="truncate text-sm text-muted-foreground">{details.join(" · ")}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm tabular-nums select-text">{formatMoney(item.plannedCents)}</span>
          <Badge variant={BADGE_VARIANTS[item.paymentStatus]}>
            {PAYMENT_STATUS_LABELS[item.paymentStatus]}
          </Badge>
        </div>
      </div>
      {!readOnly && (
        <div className="flex justify-end gap-2">
          {NEXT_ACTIONS[item.paymentStatus].map(({ status, label }) => (
            <form key={status} action={setPaymentStatus.bind(null, item.id, status)}>
              <PendingButton variant={status === "paid" ? "default" : "outline"} size="sm">
                {label}
              </PendingButton>
            </form>
          ))}
        </div>
      )}
    </li>
  );
}

export function FixedExpenseList({ rows, readOnly }: { rows: PeriodItemRow[]; readOnly?: boolean }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {rows.map((row) => (
        <FixedExpenseRow key={row.item.id} {...row} readOnly={readOnly} />
      ))}
    </ul>
  );
}
