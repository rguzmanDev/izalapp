"use server";

import { redirect } from "next/navigation";
import { getAccount, isOwnedAccount } from "@/features/accounts/data";
import { sourceAccountLocked, sourceHasFuelLogs } from "@/features/periods/locks";
import { parseFormData, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import { createBudget, deleteBudget, getBudget, updateBudget } from "./data";
import { budgetSchema } from "./schema";

export async function saveBudget(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(budgetSchema, formData);
  if (!parsed.success) return parsed.state;

  let input = parsed.data;
  if (!(await isOwnedAccount(user.id, input.spendingAccountId))) {
    return { fieldErrors: { spendingAccountId: ["Cuenta inválida"] } };
  }
  const account = await getAccount(user.id, input.spendingAccountId);
  if (!account || account.type === "credit") {
    return {
      fieldErrors: { spendingAccountId: ["Elige una cuenta bancaria o efectivo, no una tarjeta"] },
    };
  }

  if (id) {
    const current = await getBudget(user.id, id);
    if (!current) return { error: "El presupuesto ya no existe" };

    const [accountLocked, hasFuelLogs] = await Promise.all([
      sourceAccountLocked(user.id, id),
      sourceHasFuelLogs(user.id, id),
    ]);

    if (accountLocked && input.spendingAccountId !== current.spendingAccountId) {
      return {
        fieldErrors: {
          spendingAccountId: [
            "No se puede cambiar la cuenta: ya está apartado o tiene gastos en una quincena",
          ],
        },
      };
    }
    if (hasFuelLogs && current.isFuel && !input.isFuel) {
      return {
        fieldErrors: {
          isFuel: ["No se puede quitar «es gasolina»: ya hay cargas registradas"],
        },
      };
    }

    input = {
      ...input,
      spendingAccountId: accountLocked ? current.spendingAccountId : input.spendingAccountId,
      isFuel: hasFuelLogs && current.isFuel ? true : input.isFuel,
    };

    await updateBudget(user.id, id, input);
  } else {
    await createBudget(user.id, input);
  }
  redirect("/presupuestos");
}

export async function removeBudget(id: string): Promise<FormState> {
  const user = await requireUser();
  await deleteBudget(user.id, id);
  redirect("/presupuestos");
}
