/** A fixed expense either has a due date or is simply paid the day the salary comes in. */
export const DUE_MODES = ["onPayday", "dueDate"] as const;

export type DueMode = (typeof DUE_MODES)[number];

export const DUE_MODE_LABELS: Record<DueMode, string> = {
  onPayday: "El día que recibo mi pago",
  dueDate: "Tiene fecha de vencimiento",
};

export function describeDueDay(dueDay: number | null): string {
  return dueDay === null ? "al recibir tu pago" : `vence el día ${dueDay}`;
}
