"use server";

import { redirect } from "next/navigation";
import { getPlannedBalance } from "@/features/accounts/balance";
import { getAccount } from "@/features/accounts/data";
import { getPeriodItem, isPeriodOpen } from "@/features/periods/data";
import { CLOSED_EXPENSE_ERROR, resolveExpensePeriod } from "@/features/transactions/period";
import { parseFormData, type FormState } from "@/lib/form";
import { confirmInsufficient, insufficientBalanceState } from "@/lib/insufficient-balance";
import { requireUser } from "@/lib/session";
import {
  createFuelLog,
  deleteFuelLog,
  findOdometerBounds,
  getFuelLog,
  updateFuelLog,
} from "./data";
import { formatMiles } from "./format";
import { fuelLogSchema, type FuelLogInput } from "./schema";

export async function saveFuelLog(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(fuelLogSchema, formData);
  if (!parsed.success) return parsed.state;

  const item = await getPeriodItem(user.id, parsed.data.itemId);
  if (!item || item.kind !== "budget" || !item.isFuel) {
    return { fieldErrors: { itemId: ["Elige un presupuesto de gasolina"] } };
  }

  const account = await getAccount(user.id, item.accountId);
  if (!account || account.type === "credit") {
    return { fieldErrors: { itemId: ["El presupuesto de gasolina debe usar una cuenta bancaria"] } };
  }

  let creditCardId = parsed.data.creditCardId ?? null;
  if (creditCardId) {
    const card = await getAccount(user.id, creditCardId);
    if (!card || card.type !== "credit" || card.paymentAccountId !== item.accountId) {
      return { fieldErrors: { creditCardId: ["Esa tarjeta no se paga desde la cuenta del presupuesto"] } };
    }
  }

  const input: FuelLogInput = { ...parsed.data, accountId: item.accountId, creditCardId };

  const current = id ? await getFuelLog(user.id, id) : null;
  if (id && !current) return { error: "La carga ya no existe" };
  if (current && !(await isPeriodOpen(user.id, current.transaction.periodId))) {
    return { error: CLOSED_EXPENSE_ERROR };
  }

  if (!id && item.paymentStatus === "pending") {
    return {
      fieldErrors: {
        itemId: [
          "Aparta o fondea este presupuesto antes de registrar cargas (si pagaste de otra cuenta, repones después)",
        ],
      },
    };
  }

  const resolved = await resolveExpensePeriod(user.id, input);
  if ("fieldErrors" in resolved) return { fieldErrors: resolved.fieldErrors };

  if (!id) {
    const balance = await getPlannedBalance(user.id, input.accountId);
    const warning = insufficientBalanceState(
      balance,
      input.amountCents,
      confirmInsufficient(formData),
    );
    if (warning) return warning;
  }

  const { previous, next } = await findOdometerBounds(user.id, input.occurredOn, id);
  if (previous !== null && input.odometer <= previous) {
    return { fieldErrors: { odometer: [`Debe ser mayor a ${formatMiles(previous)} (carga anterior)`] } };
  }
  if (next !== null && input.odometer >= next) {
    return { fieldErrors: { odometer: [`Debe ser menor a ${formatMiles(next)} (carga posterior)`] } };
  }

  if (current) {
    await updateFuelLog(user.id, current, input, resolved.periodId);
  } else {
    await createFuelLog(user.id, input, resolved.periodId);
  }
  redirect("/gasolina");
}

export async function removeFuelLog(id: string): Promise<FormState> {
  const user = await requireUser();
  const row = await getFuelLog(user.id, id);
  if (row) {
    if (!(await isPeriodOpen(user.id, row.transaction.periodId))) {
      return { error: CLOSED_EXPENSE_ERROR };
    }
    await deleteFuelLog(user.id, row);
  }
  redirect("/gasolina");
}
