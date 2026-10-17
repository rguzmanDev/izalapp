import type { ReactNode } from "react";
import { ArrowRightIcon } from "lucide-react";
import { Section } from "@/components/section";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type {
  AccountAlert,
  AccountBalanceRow,
  AccountFlowRow,
  CardReportRow,
  TransferMapRow,
} from "../account-report";
import { ReportPanel } from "./report-panel";

function ReportList({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/80 bg-card">
      {children}
    </ul>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border/80 bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function FlowBar({ inCents, outCents }: { inCents: number; outCents: number }) {
  const total = inCents + outCents;
  if (total <= 0) {
    return <div className="h-1.5 rounded-full bg-muted" />;
  }
  const inPct = (inCents / total) * 100;
  return (
    <div
      className="flex h-1.5 overflow-hidden rounded-full bg-red-500/25"
      title={`Entró ${formatMoney(inCents)} · Salió ${formatMoney(outCents)}`}
    >
      <div className="h-full bg-emerald-600/80" style={{ width: `${inPct}%` }} />
    </div>
  );
}

export function AccountReportSections({
  balanceRows,
  flowRows,
  cardRows,
  transferMapRows,
  alerts,
}: {
  balanceRows: AccountBalanceRow[];
  flowRows: AccountFlowRow[];
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
                  "rounded-xl border px-4 py-3 text-sm",
                  alert.severity === "danger"
                    ? "border-red-500/25 bg-red-500/10 text-red-800 dark:text-red-300"
                    : "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-300",
                )}
              >
                {alert.message}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Section
          title="Saldo por cuenta"
          description="En banco ≈ físico. Tras pagar = cuando liquides las tarjetas."
        >
          {balanceRows.length === 0 ? (
            <EmptyNote>No hay cuentas.</EmptyNote>
          ) : (
            <ReportList>
              {balanceRows.map((row) => (
                <li
                  key={row.accountId}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <span className="min-w-0 truncate text-sm font-medium select-text">
                    {row.label}
                  </span>
                  <div className="shrink-0 text-right text-sm tabular-nums select-text">
                    <div
                      className={cn(
                        "font-mono font-semibold",
                        row.bankEstimateCents < 0
                          ? "text-red-700 dark:text-red-400"
                          : "text-primary",
                      )}
                    >
                      {formatMoney(row.bankEstimateCents)}
                    </div>
                    {row.cardReservedCents > 0 ? (
                      <div className="text-xs text-muted-foreground">
                        tras pagar {formatMoney(row.plannedBalanceCents)}
                        {" · "}
                        reservado {formatMoney(row.cardReservedCents)}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">En banco</div>
                    )}
                  </div>
                </li>
              ))}
            </ReportList>
          )}
        </Section>

        <Section
          title="Flujo por cuenta"
          description="Entradas vs salidas en este rango (barra = proporción)"
        >
          {flowRows.length === 0 ? (
            <EmptyNote>Sin flujo en este rango.</EmptyNote>
          ) : (
            <ReportList>
              {flowRows.map((row) => (
                <li key={row.accountId} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-medium select-text">
                      {row.label}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-sm font-semibold tabular-nums select-text",
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
                  <FlowBar inCents={row.inCents} outCents={row.outCents} />
                  <div className="flex justify-between gap-3 text-xs tabular-nums select-text">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Entró {formatMoney(row.inCents)}
                    </span>
                    <span className="text-red-700 dark:text-red-400">
                      Salió {formatMoney(row.outCents)}
                    </span>
                  </div>
                </li>
              ))}
            </ReportList>
          )}
        </Section>
      </div>

      {cardRows.length > 0 && (
        <Section
          title="Tarjetas"
          description="Seguimiento informativo: el dinero ya salió de la cuenta «Se paga desde»"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {cardRows.map((row) => (
              <ReportPanel
                key={row.accountId}
                title={row.label}
                bodyClassName="flex flex-col gap-2 py-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Por pagar</span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-red-700 dark:text-red-400 select-text">
                    {formatMoney(row.dueCents)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-2 text-center text-[11px] text-muted-foreground select-text">
                  <div>
                    <div className="font-mono text-xs text-foreground tabular-nums">
                      {formatMoney(row.chargedCents)}
                    </div>
                    Compras
                  </div>
                  <div>
                    <div className="font-mono text-xs text-foreground tabular-nums">
                      {formatMoney(row.paidCents)}
                    </div>
                    Pagos
                  </div>
                  <div>
                    <div className="font-mono text-xs text-foreground tabular-nums">
                      {formatMoney(row.currentCents)}
                    </div>
                    Ciclo
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground select-text">
                  {row.hasPaymentAccount
                    ? `Se paga desde ${row.fundingLabel} · saldo ${formatMoney(row.fundingBalanceCents ?? 0)}`
                    : "Sin «Se paga desde»"}
                </p>
              </ReportPanel>
            ))}
          </div>
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
                <div className="flex min-w-0 flex-1 items-center gap-2 select-text">
                  <span className="truncate font-medium">{row.fromLabel}</span>
                  <ArrowRightIcon className="size-3.5 shrink-0 text-primary/70" />
                  <span className="truncate font-medium">{row.toLabel}</span>
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                    · {row.count === 1 ? "1 mov." : `${row.count} mov.`}
                  </span>
                </div>
                <span className="shrink-0 font-mono font-semibold tabular-nums text-foreground select-text">
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
