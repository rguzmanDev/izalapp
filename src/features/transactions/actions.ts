"use server";

import { redirect } from "next/navigation";
import { isOwnedAccount } from "@/features/accounts/data";
import { isPeriodOpen } from "@/features/periods/data";
import { parseFormData, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import { createTransaction, deleteTransaction, getTransaction, updateTransaction } from "./data";
import { CLOSED_EXPENSE_ERROR, resolveExpensePeriod } from "./period";
import { transactionSchema } from "./schema";

export async function saveTransaction(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(transactionSchema, formData);
  if (!parsed.success) return parsed.state;

  if (!(await isOwnedAccount(user.id, parsed.data.accountId))) {
    return { fieldErrors: { accountId: ["Cuenta inválida"] } };
  }

  if (id) {
    const current = await getTransaction(user.id, id);
    if (!current) return { error: "El movimiento ya no existe" };
    if (!(await isPeriodOpen(user.id, current.periodId))) return { error: CLOSED_EXPENSE_ERROR };
  }

  const resolved = await resolveExpensePeriod(user.id, parsed.data);
  if ("fieldErrors" in resolved) return { fieldErrors: resolved.fieldErrors };

  const values = { ...parsed.data, periodId: resolved.periodId };
  if (id) {
    await updateTransaction(user.id, id, values);
    redirect("/movimientos");
  }
  await createTransaction(user.id, values);
  redirect("/");
}

export async function removeTransaction(id: string): Promise<FormState> {
  const user = await requireUser();
  const transaction = await getTransaction(user.id, id);
  if (transaction && !(await isPeriodOpen(user.id, transaction.periodId))) {
    return { error: CLOSED_EXPENSE_ERROR };
  }
  await deleteTransaction(user.id, id);
  redirect("/movimientos");
}
