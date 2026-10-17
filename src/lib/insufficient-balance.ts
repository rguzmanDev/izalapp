import { formatMoney } from "@/lib/money";
import type { FormState } from "@/lib/form";

/**
 * Planned balance already includes prior outflows. When editing one on the same
 * account, add that amount back so the check is against the balance *before* it.
 */
export function availableBalanceCents(
  plannedBalanceCents: number,
  replacingOutflowCents = 0,
): number {
  return plannedBalanceCents + Math.max(0, replacingOutflowCents);
}

/** Soft-block when planned balance cannot cover the outflow, unless the user confirmed. */
export function insufficientBalanceState(
  plannedBalanceCents: number,
  amountCents: number,
  confirmed: boolean,
): FormState | null {
  if (confirmed || amountCents <= plannedBalanceCents) return null;
  return {
    warning: `El saldo planificado de la cuenta origen es ${formatMoney(plannedBalanceCents)} y el movimiento es ${formatMoney(amountCents)}. Puedes continuar si ya moviste el dinero fuera de la app o repondrás después.`,
  };
}

export function confirmInsufficient(formData: FormData): boolean {
  return formData.get("confirmInsufficient") === "1";
}
