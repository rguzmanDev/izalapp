"use server";

import { redirect } from "next/navigation";
import { getAccount } from "@/features/accounts/data";
import { sourceUsedInPeriod } from "@/features/periods/locks";
import { parseFormData, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import { createIncome, deleteIncome, getIncome, updateIncome } from "./data";
import { incomeSchema } from "./schema";

export async function saveIncome(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(incomeSchema, formData);
  if (!parsed.success) return parsed.state;

  const input = parsed.data;
  const account = await getAccount(user.id, input.depositAccountId);
  if (!account || account.type === "credit") {
    return { fieldErrors: { depositAccountId: ["Cuenta inválida"] } };
  }

  if (id) {
    const current = await getIncome(user.id, id);
    if (!current) return { error: "El ingreso ya no existe" };
    await updateIncome(user.id, id, input);
  } else {
    await createIncome(user.id, input);
  }
  redirect("/ingresos");
}

export async function removeIncome(id: string): Promise<FormState> {
  const user = await requireUser();
  if (await sourceUsedInPeriod(user.id, id)) {
    return {
      error: "No se puede eliminar: ya se usó en una quincena. Desactívalo si ya no aplica.",
    };
  }
  await deleteIncome(user.id, id);
  redirect("/ingresos");
}
