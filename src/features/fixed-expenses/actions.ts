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

  let input = parsed.data;
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

    const locked = await sourceUsedInPeriod(user.id, id);
    if (locked) {
      if (input.paymentAccountId !== current.paymentAccountId) {
        return {
          fieldErrors: {
            paymentAccountId: [
              "No se puede cambiar la cuenta: este gasto ya se usó en una quincena",
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
            split: ["No se puede cambiar el reparto: este gasto ya se usó en una quincena"],
          },
        };
      }
      if (input.dueDay !== current.dueDay) {
        return {
          fieldErrors: {
            dueDay: ["No se puede cambiar el vencimiento: este gasto ya se usó en una quincena"],
          },
        };
      }
      input = {
        ...input,
        paymentAccountId: current.paymentAccountId,
        split: current.split,
        customFirstHalfCents: current.customFirstHalfCents,
        dueDay: current.dueDay,
      };
    }

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
