"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isOwnedAccount } from "@/features/accounts/data";
import { isPeriodOpen, resolveOpenPeriod } from "@/features/periods/data";
import { parseFormData, type FormState } from "@/lib/form";
import { todayIsoDate } from "@/lib/period";
import { requireUser } from "@/lib/session";
import {
  createTransfer,
  deleteTransfer,
  getTransfer,
  getTransferPlan,
  setAsideIfAccountFullyFunded,
  updateTransfer,
} from "./data";
import { transferSchema } from "./schema";

const CLOSED_PERIOD_ERROR = "La quincena de esta transferencia ya está cerrada";

export async function saveTransfer(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(transferSchema, formData);
  if (!parsed.success) return parsed.state;

  const { fromAccountId, toAccountId, occurredOn } = parsed.data;
  const owned = await Promise.all([
    isOwnedAccount(user.id, fromAccountId),
    isOwnedAccount(user.id, toAccountId),
  ]);
  if (owned.includes(false)) return { error: "Cuenta inválida" };

  if (id) {
    const current = await getTransfer(user.id, id);
    if (!current) return { error: "La transferencia ya no existe" };
    if (!(await isPeriodOpen(user.id, current.periodId))) return { error: CLOSED_PERIOD_ERROR };
  }

  const resolved = await resolveOpenPeriod(user.id, occurredOn);
  if ("error" in resolved) return { fieldErrors: { occurredOn: [resolved.error] } };

  const values = { ...parsed.data, periodId: resolved.periodId };
  if (id) {
    await updateTransfer(user.id, id, values);
  } else {
    await createTransfer(user.id, values);
  }
  await setAsideIfAccountFullyFunded(user.id, resolved.periodId, toAccountId);
  redirect("/movimientos");
}

export async function removeTransfer(id: string): Promise<FormState> {
  const user = await requireUser();
  const transfer = await getTransfer(user.id, id);
  if (transfer && !(await isPeriodOpen(user.id, transfer.periodId))) {
    return { error: CLOSED_PERIOD_ERROR };
  }
  await deleteTransfer(user.id, id);
  redirect("/movimientos");
}

/** Records the pending part of a planned transfer as done today. */
export async function completeTransferStep(
  periodId: string,
  fromAccountId: string,
  toAccountId: string,
) {
  const user = await requireUser();
  if (!(await isPeriodOpen(user.id, periodId))) return;

  const { steps } = await getTransferPlan(user.id, periodId);
  const step = steps.find(
    (candidate) =>
      candidate.fromAccountId === fromAccountId && candidate.toAccountId === toAccountId,
  );
  const pendingCents = step ? step.amountCents - step.doneCents : 0;
  if (pendingCents <= 0) return;

  await createTransfer(user.id, {
    periodId,
    fromAccountId,
    toAccountId,
    amountCents: pendingCents,
    occurredOn: todayIsoDate(),
    note: null,
  });
  await setAsideIfAccountFullyFunded(user.id, periodId, toAccountId);
  revalidatePath("/");
}
