"use server";

import { redirect } from "next/navigation";
import { isOwnedAccount } from "@/features/accounts/data";
import { isPeriodOpen } from "@/features/periods/data";
import { CLOSED_EXPENSE_ERROR, resolveExpensePeriod } from "@/features/transactions/period";
import { parseFormData, type FormState } from "@/lib/form";
import { requireUser } from "@/lib/session";
import {
  createFuelLog,
  deleteFuelLog,
  findOdometerBounds,
  getFuelLog,
  updateFuelLog,
} from "./data";
import { formatMiles } from "./format";
import { fuelLogSchema } from "./schema";

export async function saveFuelLog(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(fuelLogSchema, formData);
  if (!parsed.success) return parsed.state;
  const input = parsed.data;

  if (!(await isOwnedAccount(user.id, input.accountId))) {
    return { fieldErrors: { accountId: ["Cuenta inválida"] } };
  }

  const current = id ? await getFuelLog(user.id, id) : null;
  if (id && !current) return { error: "La carga ya no existe" };
  if (current && !(await isPeriodOpen(user.id, current.transaction.periodId))) {
    return { error: CLOSED_EXPENSE_ERROR };
  }

  const resolved = await resolveExpensePeriod(user.id, input);
  if ("fieldErrors" in resolved) return { fieldErrors: resolved.fieldErrors };

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
