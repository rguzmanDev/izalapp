"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPlannedBalance } from "@/features/accounts/balance";
import { getAccount, isOwnedAccount, listAccounts } from "@/features/accounts/data";
import { fundingAccountId } from "@/features/transfers/plan";
import { parseFormData, type FormState } from "@/lib/form";
import { confirmInsufficient, insufficientBalanceState } from "@/lib/insufficient-balance";
import { periodBounds, periodKeyOf, todayIsoDate, toPeriodKey } from "@/lib/period";
import { requireUser } from "@/lib/session";
import { requiredId } from "@/lib/validation";
import { z } from "zod";
import { isExtraIncome, PAYMENT_STATUSES, type PaymentStatus } from "./constants";
import {
  addExtraIncome,
  changePaymentStatus,
  closePeriod,
  deleteExtraIncome,
  getPeriod,
  getPeriodItem,
  isPeriodOpen,
  openPeriod,
  reopenPeriod,
  setAsideItem,
  updatePlannedAmount,
} from "./data";
import { closePeriodSchema, extraIncomeSchema, periodItemSchema } from "./schema";

const setAsideSchema = z.object({ fromAccountId: requiredId });

export async function openCurrentPeriod() {
  const user = await requireUser();
  await openPeriod(user.id, periodKeyOf(todayIsoDate()));
  revalidatePath("/");
}

export async function savePeriodItem(
  id: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(periodItemSchema, formData);
  if (!parsed.success) return parsed.state;

  const item = await getPeriodItem(user.id, id);
  if (!item) return { error: "La partida ya no existe" };
  if (!(await isPeriodOpen(user.id, item.periodId))) {
    return { error: "La quincena ya está cerrada" };
  }

  await updatePlannedAmount(user.id, id, parsed.data.plannedCents);
  redirect("/");
}

export async function saveExtraIncome(
  periodId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(extraIncomeSchema, formData);
  if (!parsed.success) return parsed.state;

  if (!(await isPeriodOpen(user.id, periodId))) return { error: "La quincena ya está cerrada" };
  if (!(await isOwnedAccount(user.id, parsed.data.accountId))) {
    return { fieldErrors: { accountId: ["Cuenta inválida"] } };
  }

  await addExtraIncome(user.id, periodId, parsed.data);
  redirect("/");
}

export async function removeExtraIncome(id: string): Promise<FormState> {
  const user = await requireUser();
  const item = await getPeriodItem(user.id, id);
  if (!item || !isExtraIncome(item)) return { error: "Solo se pueden eliminar ingresos extra" };
  if (!(await isPeriodOpen(user.id, item.periodId))) return { error: "La quincena ya está cerrada" };

  await deleteExtraIncome(user.id, id);
  redirect("/");
}

export async function setPaymentStatus(id: string, status: PaymentStatus) {
  const user = await requireUser();
  const item = await getPeriodItem(user.id, id);
  if (!item || !PAYMENT_STATUSES.includes(status)) return;
  if (!(await isPeriodOpen(user.id, item.periodId))) return;

  // Fresh apartados need an origin account (setAsideWithTransfer). Undo-to-apartado is fine here.
  if (status === "set_aside" && item.paymentStatus === "pending") return;

  if (item.kind === "fixed_expense") {
    await changePaymentStatus(item, status, todayIsoDate());
  } else if (item.kind === "budget" && status !== "paid") {
    await changePaymentStatus(item, status, todayIsoDate());
  } else {
    return;
  }

  revalidatePath("/");
}

/**
 * Marks a pending budget/fixed expense as apartado and records the funding transfer
 * from the chosen origin into the account that holds the money for that item
 * (the item account, or the card's "Se paga desde" account).
 */
export async function setAsideWithTransfer(
  itemId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(setAsideSchema, formData);
  if (!parsed.success) return parsed.state;

  const item = await getPeriodItem(user.id, itemId);
  if (!item || (item.kind !== "fixed_expense" && item.kind !== "budget")) {
    return { error: "La partida ya no existe" };
  }
  if (item.paymentStatus !== "pending") return { error: "Esta partida ya no está pendiente" };
  if (!(await isPeriodOpen(user.id, item.periodId))) return { error: "La quincena ya está cerrada" };

  const { fromAccountId } = parsed.data;
  if (!(await isOwnedAccount(user.id, fromAccountId))) {
    return { fieldErrors: { fromAccountId: ["Cuenta inválida"] } };
  }

  const accounts = await listAccounts(user.id);
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const itemAccount = accountsById.get(item.accountId);
  const toAccountId = fundingAccountId(itemAccount, item.accountId);

  if (!(await isOwnedAccount(user.id, toAccountId))) {
    return {
      error:
        itemAccount?.type === "credit"
          ? "Define «Se paga desde» en la tarjeta antes de apartar"
          : "Cuenta de destino inválida",
    };
  }

  let transfer: { fromAccountId: string; toAccountId: string; occurredOn: string } | null = null;
  if (fromAccountId !== toAccountId) {
    const fromAccount = await getAccount(user.id, fromAccountId);
    if (fromAccount?.type === "credit") {
      return { fieldErrors: { fromAccountId: ["El origen no puede ser una tarjeta de crédito"] } };
    }

    const balance = await getPlannedBalance(user.id, fromAccountId);
    const warning = insufficientBalanceState(
      balance,
      item.plannedCents,
      confirmInsufficient(formData),
    );
    if (warning) return warning;

    transfer = { fromAccountId, toAccountId, occurredOn: todayIsoDate() };
  }

  const result = await setAsideItem(item, transfer);
  if (result === "not_pending") return { error: "Esta partida ya no está pendiente" };
  redirect("/");
}

export async function closePeriodAction(
  periodId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const period = await getPeriod(user.id, periodId);
  if (!period) return { error: "La quincena ya no existe" };
  if (period.status === "closed") redirect("/");

  const parsed = parseFormData(closePeriodSchema, formData);
  if (!parsed.success) return parsed.state;

  const { surplusCents, fromAccountId, toAccountId } = parsed.data;
  let surplus = null;
  if (surplusCents && fromAccountId && toAccountId) {
    const owned = await Promise.all([
      isOwnedAccount(user.id, fromAccountId),
      isOwnedAccount(user.id, toAccountId),
    ]);
    if (owned.includes(false)) return { error: "Cuenta inválida" };

    const today = todayIsoDate();
    const { end } = periodBounds(toPeriodKey(period));
    surplus = {
      fromAccountId,
      toAccountId,
      amountCents: surplusCents,
      occurredOn: today < end ? today : end,
    };
  }

  await closePeriod(user.id, period.id, surplus);
  redirect("/");
}

export async function reopenPeriodAction(periodId: string) {
  const user = await requireUser();
  const period = await getPeriod(user.id, periodId);
  if (!period) return;

  await reopenPeriod(user.id, period.id);
  revalidatePath("/");
}
