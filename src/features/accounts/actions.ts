"use server";

import { redirect } from "next/navigation";
import { isForeignKeyViolation } from "@/db/errors";
import { parseFormData, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import { createAccount, deleteAccount, getAccount, isOwnedAccount, updateAccount } from "./data";
import { accountHasLedgerActivity, cardHasStatementActivity } from "./locks";
import { accountSchema } from "./schema";

export async function saveAccount(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(accountSchema, formData);
  if (!parsed.success) return parsed.state;

  let input = parsed.data;
  const { paymentAccountId } = input;
  if (
    paymentAccountId &&
    (paymentAccountId === id || !(await isOwnedAccount(user.id, paymentAccountId)))
  ) {
    return { fieldErrors: { paymentAccountId: ["Cuenta inválida"] } };
  }

  if (id) {
    const current = await getAccount(user.id, id);
    if (!current) return { error: "La cuenta ya no existe" };

    if (input.type !== current.type) {
      return {
        fieldErrors: {
          type: ["No se puede cambiar el tipo de una cuenta que ya existe"],
        },
      };
    }

    const [hasLedger, hasCardActivity] = await Promise.all([
      accountHasLedgerActivity(user.id, id),
      current.type === "credit"
        ? cardHasStatementActivity(user.id, id)
        : Promise.resolve(false),
    ]);

    if (hasLedger && input.openingBalanceCents !== current.openingBalanceCents) {
      return {
        fieldErrors: {
          openingBalanceCents: [
            "El saldo o deuda inicial no se puede cambiar cuando ya hay movimientos",
          ],
        },
      };
    }

    if (
      hasCardActivity &&
      (input.paymentAccountId ?? null) !== (current.paymentAccountId ?? null)
    ) {
      return {
        fieldErrors: {
          paymentAccountId: [
            "No se puede cambiar «Se paga desde» cuando la tarjeta ya tiene compras o pagos",
          ],
        },
      };
    }

    input = {
      ...input,
      type: current.type,
      openingBalanceCents: hasLedger ? current.openingBalanceCents : input.openingBalanceCents,
      paymentAccountId: hasCardActivity ? current.paymentAccountId : input.paymentAccountId,
    };

    await updateAccount(user.id, id, input);
  } else {
    await createAccount(user.id, input);
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
