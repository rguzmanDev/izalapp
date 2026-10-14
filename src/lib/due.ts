/** Payments start counting down this many days before they are due. */
export const DUE_SOON_DAYS = 7;

export const isDueSoon = (daysLeft: number) => daysLeft <= DUE_SOON_DAYS;

/** "vence hoy", "vence mañana", "vence en 5 días" or "venció hace 2 días". */
export function describeDueIn(daysLeft: number): string {
  if (daysLeft === 0) return "vence hoy";
  if (daysLeft === 1) return "vence mañana";
  if (daysLeft > 1) return `vence en ${daysLeft} días`;
  return daysLeft === -1 ? "venció ayer" : `venció hace ${-daysLeft} días`;
}
