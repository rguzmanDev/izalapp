"use server";

import { redirect } from "next/navigation";
import { isOwnedAccount } from "@/features/accounts/data";
import { parseFormData, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import { createBudget, deleteBudget, updateBudget } from "./data";
import { budgetSchema } from "./schema";

export async function saveBudget(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(budgetSchema, formData);
  if (!parsed.success) return parsed.state;

  if (!(await isOwnedAccount(user.id, parsed.data.spendingAccountId))) {
    return { fieldErrors: { spendingAccountId: ["Cuenta inválida"] } };
  }

  if (id) {
    await updateBudget(user.id, id, parsed.data);
  } else {
    await createBudget(user.id, parsed.data);
  }
  redirect("/presupuestos");
}

export async function removeBudget(id: string): Promise<FormState> {
  const user = await requireUser();
  await deleteBudget(user.id, id);
  redirect("/presupuestos");
}
