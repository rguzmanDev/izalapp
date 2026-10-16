"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isOwnedAccount } from "@/features/accounts/data";
import { parseFormData, type FormState } from "@/lib/form";
import { periodBounds, periodKeyOf, todayIsoDate, toPeriodKey } from "@/lib/period";
import { requireUser } from "@/lib/session";
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
  updatePlannedAmount,
} from "./data";
import { closePeriodSchema, extraIncomeSchema, periodItemSchema } from "./schema";

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

  if (item.kind === "fixed_expense") {
    await changePaymentStatus(item, status, todayIsoDate());
  } else if (item.kind === "budget" && status !== "paid") {
    await changePaymentStatus(item, status, todayIsoDate());
  } else {
    return;
  }

  revalidatePath("/");
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
