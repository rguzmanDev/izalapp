import type { CardStatement } from "./data";

/** What is left to pay of the last statement. */
export function pendingCents({ statementCents, paidCents }: CardStatement): number {
  return Math.max(0, statementCents - paidCents);
}

/** Transfer form prefilled to pay the pending amount from the card's usual account. */
export function paymentHref(statement: CardStatement): string {
  const { card } = statement;
  const params = new URLSearchParams({ hacia: card.id, monto: String(pendingCents(statement)) });
  if (card.paymentAccountId) params.set("desde", card.paymentAccountId);
  return `/transferencias/nueva?${params}`;
}
