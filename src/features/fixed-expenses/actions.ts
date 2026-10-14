"use server";

import { redirect } from "next/navigation";
import { isOwnedAccount } from "@/features/accounts/data";
import { parseFormData, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import { createFixedExpense, deleteFixedExpense, updateFixedExpense } from "./data";
import { fixedExpenseSchema } from "./schema";

export async function saveFixedExpense(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(fixedExpenseSchema, formData);
  if (!parsed.success) return parsed.state;

  if (!(await isOwnedAccount(user.id, parsed.data.paymentAccountId))) {
    return { fieldErrors: { paymentAccountId: ["Cuenta inválida"] } };
  }

  if (id) {
    await updateFixedExpense(user.id, id, parsed.data);
  } else {
    await createFixedExpense(user.id, parsed.data);
  }
  redirect("/gastos-fijos");
}

export async function removeFixedExpense(id: string): Promise<FormState> {
  const user = await requireUser();
  await deleteFixedExpense(user.id, id);
  redirect("/gastos-fijos");
}
