"use server";

import { redirect } from "next/navigation";
import { getAccount, isOwnedAccount } from "@/features/accounts/data";
import { sourceUsedInPeriod } from "@/features/periods/locks";
import { parseFormData, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import { createFixedExpense, deleteFixedExpense, getFixedExpense, updateFixedExpense } from "./data";
import { fixedExpenseSchema } from "./schema";

export async function saveFixedExpense(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(fixedExpenseSchema, formData);
  if (!parsed.success) return parsed.state;

  const input = parsed.data;
  if (!(await isOwnedAccount(user.id, input.paymentAccountId))) {
    return { fieldErrors: { paymentAccountId: ["Cuenta inválida"] } };
  }
  const account = await getAccount(user.id, input.paymentAccountId);
  if (!account || account.type === "credit") {
    return {
      fieldErrors: { paymentAccountId: ["Elige una cuenta bancaria o efectivo, no una tarjeta"] },
    };
  }

  if (id) {
    const current = await getFixedExpense(user.id, id);
    if (!current) return { error: "El gasto fijo ya no existe" };
    await updateFixedExpense(user.id, id, input);
  } else {
    await createFixedExpense(user.id, input);
  }
  redirect("/gastos-fijos");
}

export async function removeFixedExpense(id: string): Promise<FormState> {
  const user = await requireUser();
  if (await sourceUsedInPeriod(user.id, id)) {
    return {
      error: "No se puede eliminar: ya se usó en una quincena. Desactívalo si ya no aplica.",
    };
  }
  await deleteFixedExpense(user.id, id);
  redirect("/gastos-fijos");
}
