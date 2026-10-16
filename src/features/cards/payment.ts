import type { CardStatement } from "./data";

/** What is left to pay of the last statement. */
export function pendingCents({ statementCents, paidCents }: CardStatement): number {
  return Math.max(0, statementCents - paidCents);
}

/** Form to record an informative card payment (does not move bank money). */
export function paymentHref(statement: CardStatement): string {
  const params = new URLSearchParams({ monto: String(pendingCents(statement)) });
  return `/tarjetas/${statement.card.id}/pagar?${params}`;
}
