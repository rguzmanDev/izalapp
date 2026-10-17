"use server";

import { redirect } from "next/navigation";
import { getAccount, isOwnedAccount } from "@/features/accounts/data";
import { sourceHasFuelLogs, sourceUsedInPeriod } from "@/features/periods/locks";
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

    const [used, hasFuelLogs] = await Promise.all([
      sourceUsedInPeriod(user.id, id),
      sourceHasFuelLogs(user.id, id),
    ]);
    const fuelLocked = used || hasFuelLogs;

    if (used) {
      if (input.spendingAccountId !== current.spendingAccountId) {
        return {
          fieldErrors: {
            spendingAccountId: [
              "No se puede cambiar la cuenta: este presupuesto ya se usó en una quincena",
            ],
          },
        };
      }
      if (
        input.split !== current.split ||
        input.customFirstHalfCents !== current.customFirstHalfCents
      ) {
        return {
          fieldErrors: {
            split: ["No se puede cambiar el reparto: este presupuesto ya se usó en una quincena"],
          },
        };
      }
    }
    if (fuelLocked && input.isFuel !== current.isFuel) {
      return {
        fieldErrors: {
          isFuel: [
            "No se puede cambiar «es gasolina»: ya se usó en una quincena o tiene cargas",
          ],
        },
      };
    }

    input = {
      ...input,
      spendingAccountId: used ? current.spendingAccountId : input.spendingAccountId,
      split: used ? current.split : input.split,
      customFirstHalfCents: used ? current.customFirstHalfCents : input.customFirstHalfCents,
      isFuel: fuelLocked ? current.isFuel : input.isFuel,
    };

    await updateBudget(user.id, id, input);
  } else {
    await createBudget(user.id, input);
  }
  redirect("/presupuestos");
}

export async function removeBudget(id: string): Promise<FormState> {
  const user = await requireUser();
  if (await sourceUsedInPeriod(user.id, id)) {
    return {
      error: "No se puede eliminar: ya se usó en una quincena. Desactívalo si ya no aplica.",
    };
  }
  await deleteBudget(user.id, id);
  redirect("/presupuestos");
}
