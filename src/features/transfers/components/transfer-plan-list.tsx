import { ArrowDownIcon } from "lucide-react";
import { LinkButton } from "@/components/link-button";
import { Badge } from "@/components/ui/badge";
import type { FinancialAccount } from "@/db/schema";
import { accountLabel } from "@/features/accounts/format";
import { formatMoney } from "@/lib/money";
import type { TransferStep, TransferStepCover } from "../plan";

type TransferPlanListProps = {
  periodId: string;
  steps: TransferStep[];
  accounts: FinancialAccount[];
  readOnly?: boolean;
};

function coversLabel(covers: TransferStepCover[]) {
  if (covers.length === 0) return null;
  return covers.map((cover) => `${cover.name} ${formatMoney(cover.amountCents)}`).join(" · ");
}

export function TransferPlanList({ periodId, steps, accounts, readOnly }: TransferPlanListProps) {
  const labelOf = (accountId: string) => {
    const account = accounts.find((candidate) => candidate.id === accountId);
    return account ? accountLabel(account) : "Cuenta eliminada";
  };

  return (
    <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {steps.map((step) => {
        const pendingCents = step.amountCents - step.doneCents;
        const covers = coversLabel(step.covers);
        return (
          <li
            key={step.toAccountId}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex min-w-0 flex-col text-sm select-text">
              <span className="truncate text-muted-foreground">
                Sugerido: {labelOf(step.suggestedFromAccountId)}
              </span>
              <ArrowDownIcon className="size-3.5 text-muted-foreground" />
              <span className="truncate">{labelOf(step.toAccountId)}</span>
              {covers && (
                <span className="mt-1 text-xs text-muted-foreground line-clamp-2">{covers}</span>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-medium tabular-nums select-text">
                {formatMoney(step.amountCents)}
              </span>
              {pendingCents <= 0 ? (
                <Badge>Hecho</Badge>
              ) : (
                <>
                  {step.doneCents > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Faltan {formatMoney(pendingCents)}
                    </span>
                  )}
                  {!readOnly && (
                    <LinkButton
                      href={`/fondear/${periodId}/${step.toAccountId}`}
                      size="sm"
                    >
                      Ya lo moví
                    </LinkButton>
                  )}
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
