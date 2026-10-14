"use server";

import { redirect } from "next/navigation";
import { isForeignKeyViolation } from "@/db/errors";
import { parseFormData, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import { createAccount, deleteAccount, isOwnedAccount, updateAccount } from "./data";
import { accountSchema } from "./schema";

export async function saveAccount(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(accountSchema, formData);
  if (!parsed.success) return parsed.state;

  const { paymentAccountId } = parsed.data;
  if (
    paymentAccountId &&
    (paymentAccountId === id || !(await isOwnedAccount(user.id, paymentAccountId)))
  ) {
    return { fieldErrors: { paymentAccountId: ["Cuenta inválida"] } };
  }

  if (id) {
    await updateAccount(user.id, id, parsed.data);
  } else {
    await createAccount(user.id, parsed.data);
  }
  redirect("/cuentas");
}

export async function removeAccount(id: string): Promise<FormState> {
  const user = await requireUser();
  try {
    await deleteAccount(user.id, id);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return {
        error: "No se puede eliminar: la usan ingresos, gastos fijos, presupuestos o movimientos.",
      };
    }
    throw error;
  }
  redirect("/cuentas");
}
