import type { ReactNode } from "react";
import { ArrowDownIcon } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";
import { Section } from "@/components/section";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type {
  AccountAlert,
  AccountBalanceRow,
  AccountFlowRow,
  CardReportRow,
  FundingUseRow,
  TransferMapRow,
} from "../account-report";

function ReportList({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {children}
    </ul>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-card px-4 py-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
      {children}
    </p>
  );
}

export function AccountReportSections({
  balanceRows,
  flowRows,
  fundingRows,
  cardRows,
  transferMapRows,
  alerts,
}: {
  balanceRows: AccountBalanceRow[];
  flowRows: AccountFlowRow[];
  fundingRows: FundingUseRow[];
  cardRows: CardReportRow[];
  transferMapRows: TransferMapRow[];
  alerts: AccountAlert[];
}) {
  return (
    <>
      {alerts.length > 0 && (
        <Section title="Alertas" description="Cosas a revisar en tus cuentas">
          <ul className="flex flex-col gap-2">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm ring-1",
                  alert.severity === "danger"
                    ? "bg-red-500/10 text-red-800 ring-red-500/20 dark:text-red-300"
                    : "bg-amber-500/10 text-amber-900 ring-amber-500/20 dark:text-amber-300",
                )}
              >
                {alert.message}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        title="Saldo por cuenta"
        description="En banco ≈ físico (aún no pagaste tarjetas). Tras pagar = lo que queda cuando liquides esas compras."
      >
        {balanceRows.length === 0 ? (
          <EmptyNote>No hay cuentas.</EmptyNote>
        ) : (
          <ReportList>
            {balanceRows.map((row) => (
              <li key={row.accountId} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span className="min-w-0 truncate text-sm font-medium select-text">{row.label}</span>
                <div className="shrink-0 text-right text-sm tabular-nums select-text">
                  <div
                    className={cn(
                      "font-medium",
                      row.bankEstimateCents < 0
                        ? "text-red-700 dark:text-red-400"
                        : "text-emerald-700 dark:text-emerald-400",
                    )}
                  >
                    En banco {formatMoney(row.bankEstimateCents)}
                  </div>
                  {row.cardReservedCents > 0 ? (
                    <div className="text-xs text-muted-foreground">
                      tras pagar {formatMoney(row.plannedBalanceCents)}
                      {" · "}
                      reservado {formatMoney(row.cardReservedCents)}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ReportList>
        )}
      </Section>

      <Section
        title="Flujo por cuenta"
        description="Solo este rango: entradas (ingresos + transferencias in) vs salidas (gastos + transferencias out)"
      >
        {flowRows.length === 0 ? (
          <EmptyNote>Sin flujo en este rango.</EmptyNote>
        ) : (
          <ReportList>
            {flowRows.map((row) => (
              <li key={row.accountId} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-medium select-text">{row.label}</span>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-medium tabular-nums select-text",
                      row.netCents > 0
                        ? "text-emerald-700 dark:text-emerald-400"
                        : row.netCents < 0
                          ? "text-red-700 dark:text-red-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {row.netCents > 0 ? "+" : row.netCents < 0 ? "−" : ""}
                    {formatMoney(Math.abs(row.netCents))}
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-xs tabular-nums select-text">
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Entró {formatMoney(row.inCents)}
                  </span>
                  <span className="text-red-700 dark:text-red-400">
                    Salió {formatMoney(row.outCents)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground select-text">
                  <span>Ingresos {formatMoney(row.incomeCents)}</span>
                  <span className="text-right">Gastos {formatMoney(row.expenseCents)}</span>
                  <span>Transf. in {formatMoney(row.transferInCents)}</span>
                  <span className="text-right">Transf. out {formatMoney(row.transferOutCents)}</span>
                </div>
              </li>
            ))}
          </ReportList>
        )}
      </Section>

      <Section
        title="Fondeo vs uso"
        description="Apartado hacia la cuenta vs compras etiquetadas con tarjetas que se pagan desde ella"
      >
        {fundingRows.length === 0 ? (
          <EmptyNote>Sin fondeo ni uso en este rango.</EmptyNote>
        ) : (
          <ReportList>
            {fundingRows.map((row) => {
              const max = Math.max(row.fundedCents, row.spentCents, 1);
              return (
                <li key={row.accountId} className="flex flex-col gap-2 px-4 py-3">
                  <span className="truncate text-sm font-medium select-text">{row.label}</span>
                  <div className="flex justify-between gap-3 text-xs tabular-nums select-text">
                    <span className="text-amber-800 dark:text-amber-400">
                      Apartado {formatMoney(row.fundedCents)}
                    </span>
                    <span className="text-red-700 dark:text-red-400">
                      Usado en tarjetas {formatMoney(row.spentCents)}
                    </span>
                  </div>
                  <ProgressBar value={row.spentCents} max={max} />
                  {row.spentCents > row.fundedCents && (
                    <span className="text-xs text-red-700 dark:text-red-400">
                      Usaste {formatMoney(row.spentCents - row.fundedCents)} más de lo apartado
                    </span>
                  )}
                </li>
              );
            })}
          </ReportList>
        )}
      </Section>

      {cardRows.length > 0 && (
        <Section
          title="Tarjetas"
          description="Seguimiento informativo: compras etiquetadas y pagos registrados; el dinero ya salió de la cuenta «Se paga desde»"
        >
          <ReportList>
            {cardRows.map((row) => (
              <li key={row.accountId} className="flex flex-col gap-1.5 px-4 py-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-medium select-text">{row.label}</span>
                  <span className="shrink-0 tabular-nums text-red-700 dark:text-red-400 select-text">
                    Por pagar {formatMoney(row.dueCents)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground select-text">
                  <span>Compras {formatMoney(row.chargedCents)}</span>
                  <span>Pagos {formatMoney(row.paidCents)}</span>
                  <span>Ciclo actual {formatMoney(row.currentCents)}</span>
                </div>
                <span className="text-xs text-muted-foreground select-text">
                  {row.hasPaymentAccount
                    ? `Se paga desde ${row.fundingLabel} · saldo ${formatMoney(row.fundingBalanceCents ?? 0)}`
                    : "Sin «Se paga desde»"}
                </span>
              </li>
            ))}
          </ReportList>
        </Section>
      )}

      <Section title="Mapa de transferencias" description="Origen → destino en el rango">
        {transferMapRows.length === 0 ? (
          <EmptyNote>Sin transferencias en este rango.</EmptyNote>
        ) : (
          <ReportList>
            {transferMapRows.map((row) => (
              <li
                key={row.key}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="flex min-w-0 flex-col select-text">
                  <span className="truncate">{row.fromLabel}</span>
                  <ArrowDownIcon className="size-3.5 text-amber-600" />
                  <span className="truncate">{row.toLabel}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.count === 1 ? "1 movimiento" : `${row.count} movimientos`}
                  </span>
                </div>
                <span className="shrink-0 font-medium tabular-nums text-amber-800 dark:text-amber-400 select-text">
                  {formatMoney(row.amountCents)}
                </span>
              </li>
            ))}
          </ReportList>
        )}
      </Section>
    </>
  );
}
