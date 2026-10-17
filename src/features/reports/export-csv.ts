import "server-only";
import { listFuelLogs } from "@/features/fuel/data";
import { refillStats } from "@/features/fuel/stats";
import { spentCentsOf } from "@/features/periods/summary";
import {
  getAccountReports,
  getPeriodReports,
  listMovementsForPeriods,
} from "@/features/reports/data";
import { buildCsvDocument, csvMoney } from "@/features/reports/csv";
import { buildMovementReport, MOVEMENT_KIND_LABELS } from "@/features/reports/movement-report";
import { formatShortDate, periodLabel, toPeriodKey } from "@/lib/period";

/** Full multi-section CSV for the selected quincena range. */
export async function buildReportsCsv(userId: string, range: number): Promise<string> {
  const [reports, refills] = await Promise.all([
    getPeriodReports(userId, range),
    listFuelLogs(userId),
  ]);

  if (reports.length === 0) {
    return buildCsvDocument([
      { title: "Totales", headers: ["concepto", "valor"], rows: [["Sin datos", ""]] },
    ]);
  }

  const periodIds = reports.map((report) => report.period.id);
  const [movements, accountReport] = await Promise.all([
    listMovementsForPeriods(userId, periodIds),
    getAccountReports(userId, periodIds),
  ]);
  const movementEntries = buildMovementReport(
    movements.expenses,
    movements.transfers,
    movements.incomes,
    "todos",
  );

  const summaries = reports.map((report) => report.summary);
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

  const fuelStats = refillStats(
    refills.map(({ log, transaction }) => ({ ...log, amountCents: transaction.amountCents })),
  );
  const fuelRows = refills.flatMap(({ transaction, log }, index) => {
    const mpg = fuelStats[index].milesPerGallon;
    if (mpg === null) return [];
    return [
      [
        formatShortDate(transaction.occurredOn),
        csvMoney(transaction.amountCents),
        log.gallons,
        Math.round(mpg * 10) / 10,
      ],
    ];
  });

  const tables: Parameters<typeof buildCsvDocument>[0] = [
    {
      title: "Totales",
      headers: ["concepto", "monto"],
      rows: [
        ["Rango solicitado (quincenas)", range],
        ["Quincenas incluidas", reports.length],
        ["Ingreso", csvMoney(sum(summaries.map((s) => s.incomeCents)))],
        ["Gastado (registrado)", csvMoney(sum(summaries.map(spentCentsOf)))],
        [
          "Sobrante (fijos en plan)",
          csvMoney(sum(summaries.map((s) => s.actualSurplusCents))),
        ],
        ["Ahorrado al cerrar", csvMoney(sum(reports.map((r) => r.savedCents)))],
        ["Excesos", csvMoney(sum(summaries.map((s) => s.overspentCents)))],
      ],
    },
    {
      title: "Por quincena",
      headers: [
        "quincena",
        "ingreso",
        "gastos_fijos_registrados",
        "presupuestos",
        "otros_gastos",
        "excesos",
        "sobrante",
        "ahorrado_al_cerrar",
        "estado",
      ],
      rows: reports.map(({ period, summary, savedCents }) => [
        periodLabel(toPeriodKey(period)),
        csvMoney(summary.incomeCents),
        csvMoney(summary.fixedSpentCents),
        csvMoney(summary.budgetSpentCents),
        csvMoney(summary.unbudgetedCents),
        csvMoney(summary.overspentCents),
        csvMoney(summary.actualSurplusCents),
        csvMoney(savedCents),
        period.status,
      ]),
    },
    {
      title: "Movimientos",
      headers: ["corte", "tipo", "titulo", "detalle", "monto", "fecha"],
      rows: movementEntries.map((entry) => [
        entry.periodLabel,
        MOVEMENT_KIND_LABELS[entry.kind],
        entry.title,
        entry.subtitle,
        csvMoney(entry.amountCents),
        entry.occurredOn,
      ]),
    },
    {
      title: "Alertas",
      headers: ["severidad", "mensaje"],
      rows: accountReport.alerts.map((alert) => [alert.severity, alert.message]),
    },
    {
      title: "Saldo por cuenta",
      headers: [
        "cuenta",
        "en_banco",
        "tras_pagar_tarjetas",
        "reservado_tarjetas",
        "es_tarjeta",
      ],
      rows: accountReport.balanceRows.map((row) => [
        row.label,
        csvMoney(row.bankEstimateCents),
        csvMoney(row.plannedBalanceCents),
        csvMoney(row.cardReservedCents),
        row.isCredit ? "si" : "no",
      ]),
    },
    {
      title: "Flujo por cuenta (solo este rango)",
      headers: [
        "cuenta",
        "ingresos",
        "transferencias_in",
        "gastos",
        "transferencias_out",
        "entro",
        "salio",
        "neto_rango",
      ],
      rows: accountReport.flowRows.map((row) => [
        row.label,
        csvMoney(row.incomeCents),
        csvMoney(row.transferInCents),
        csvMoney(row.expenseCents),
        csvMoney(row.transferOutCents),
        csvMoney(row.inCents),
        csvMoney(row.outCents),
        csvMoney(row.netCents),
      ]),
    },
    {
      title: "Tarjetas",
      headers: [
        "tarjeta",
        "compras_rango",
        "pagos_rango",
        "por_pagar",
        "ciclo_actual",
        "se_paga_desde",
        "saldo_fondeo",
      ],
      rows: accountReport.cardRows.map((row) => [
        row.label,
        csvMoney(row.chargedCents),
        csvMoney(row.paidCents),
        csvMoney(row.dueCents),
        csvMoney(row.currentCents),
        row.fundingLabel,
        row.fundingBalanceCents === null ? "" : csvMoney(row.fundingBalanceCents),
      ]),
    },
    {
      title: "Mapa de transferencias",
      headers: ["desde", "hacia", "monto", "movimientos"],
      rows: accountReport.transferMapRows.map((row) => [
        row.fromLabel,
        row.toLabel,
        csvMoney(row.amountCents),
        row.count,
      ]),
    },
  ];

  if (fuelRows.length > 0) {
    tables.push({
      title: "Rendimiento de gasolina",
      headers: ["fecha", "monto", "galones", "mi_por_galon"],
      rows: fuelRows,
    });
  }

  return buildCsvDocument(tables);
}
