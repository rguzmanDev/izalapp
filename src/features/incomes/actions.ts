"use server";

import { redirect } from "next/navigation";
import { getAccount } from "@/features/accounts/data";
import { parseFormData, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import { createIncome, deleteIncome, updateIncome } from "./data";
import { incomeSchema } from "./schema";

export async function saveIncome(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(incomeSchema, formData);
  if (!parsed.success) return parsed.state;

  const account = await getAccount(user.id, parsed.data.depositAccountId);
  if (!account || account.type === "credit") {
    return { fieldErrors: { depositAccountId: ["Cuenta inválida"] } };
  }

  if (id) {
    await updateIncome(user.id, id, parsed.data);
  } else {
    await createIncome(user.id, parsed.data);
  }
  redirect("/ingresos");
}

export async function removeIncome(id: string): Promise<FormState> {
  const user = await requireUser();
  await deleteIncome(user.id, id);
  redirect("/ingresos");
}
