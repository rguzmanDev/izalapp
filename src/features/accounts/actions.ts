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

    // Restrictive: opening balance and card funding account only set at create time.
    if (input.openingBalanceCents !== current.openingBalanceCents) {
      return {
        fieldErrors: {
          openingBalanceCents: [
            "El saldo o deuda inicial solo se define al crear la cuenta",
          ],
        },
      };
    }

    if (
      current.type === "credit" &&
      (input.paymentAccountId ?? null) !== (current.paymentAccountId ?? null)
    ) {
      return {
        fieldErrors: {
          paymentAccountId: [
            "«Se paga desde» solo se define al crear la tarjeta",
          ],
        },
      };
    }

    const hasCardActivity =
      current.type === "credit" ? await cardHasStatementActivity(user.id, id) : false;

    if (hasCardActivity) {
      const scheduleChanged =
        input.statementDay !== current.statementDay ||
        input.paymentDueDay !== current.paymentDueDay ||
        input.paymentDueDaysAfterCutoff !== current.paymentDueDaysAfterCutoff;
      if (scheduleChanged) {
        return {
          fieldErrors: {
            statementDay: [
              "No se puede cambiar el corte o la fecha de pago: la tarjeta ya tiene compras o pagos",
            ],
          },
        };
      }
    }

    input = {
      ...input,
      type: current.type,
      openingBalanceCents: current.openingBalanceCents,
      paymentAccountId:
        current.type === "credit" ? current.paymentAccountId : input.paymentAccountId,
      statementDay: hasCardActivity ? current.statementDay : input.statementDay,
      paymentDueDay: hasCardActivity ? current.paymentDueDay : input.paymentDueDay,
      paymentDueDaysAfterCutoff: hasCardActivity
        ? current.paymentDueDaysAfterCutoff
        : input.paymentDueDaysAfterCutoff,
    };

    await updateAccount(user.id, id, input);
  } else {
    await createAccount(user.id, input);
  }
  redirect("/cuentas");
}

export async function removeAccount(id: string): Promise<FormState> {
  const user = await requireUser();
  if (await accountHasLedgerActivity(user.id, id)) {
    return {
      error: "No se puede eliminar: ya tiene movimientos o partidas.",
    };
  }
  if (await cardHasStatementActivity(user.id, id)) {
    return {
      error: "No se puede eliminar: la tarjeta ya tiene compras o pagos.",
    };
  }
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
