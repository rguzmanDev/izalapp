"use server";

import { redirect } from "next/navigation";
import { getPlannedBalance } from "@/features/accounts/balance";
import { getAccount, isOwnedAccount } from "@/features/accounts/data";
import { isPeriodOpen, resolveOpenPeriod } from "@/features/periods/data";
import { parseFormData, type FormState } from "@/lib/form";
import { confirmInsufficient, insufficientBalanceState } from "@/lib/insufficient-balance";
import { todayIsoDate } from "@/lib/period";
import { requireUser } from "@/lib/session";
import { requiredId } from "@/lib/validation";
import { z } from "zod";
import {
  createTransfer,
  deleteTransfer,
  fundAccountStep,
  getTransfer,
  getTransferPlan,
  setAsideIfAccountFullyFunded,
  setAsidePendingForAccount,
  updateTransfer,
} from "./data";
import { transferSchema } from "./schema";

const completeStepSchema = z.object({ fromAccountId: requiredId });

const CLOSED_PERIOD_ERROR = "La quincena de esta transferencia ya está cerrada";

export async function saveTransfer(
  id: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseFormData(transferSchema, formData);
  if (!parsed.success) return parsed.state;

  const { fromAccountId, toAccountId, occurredOn, amountCents } = parsed.data;
  const owned = await Promise.all([
    isOwnedAccount(user.id, fromAccountId),
    isOwnedAccount(user.id, toAccountId),
  ]);
  if (owned.includes(false)) return { error: "Cuenta inválida" };

  const [fromAccount, toAccount] = await Promise.all([
    getAccount(user.id, fromAccountId),
    getAccount(user.id, toAccountId),
  ]);
  if (fromAccount?.type === "credit") {
    return { fieldErrors: { fromAccountId: ["El origen no puede ser una tarjeta de crédito"] } };
  }
  if (toAccount?.type === "credit") {
    return {
      fieldErrors: {
        toAccountId: ["Las tarjetas solo se pagan con «Pagar» (no mueven el banco otra vez)"],
      },
    };
  }

  if (id) {
    const current = await getTransfer(user.id, id);
    if (!current) return { error: "La transferencia ya no existe" };
    if (!(await isPeriodOpen(user.id, current.periodId))) return { error: CLOSED_PERIOD_ERROR };
  }

  const resolved = await resolveOpenPeriod(user.id, occurredOn);
  if ("error" in resolved) return { fieldErrors: { occurredOn: [resolved.error] } };

  const balance = await getPlannedBalance(user.id, fromAccountId);
  const warning = insufficientBalanceState(
    balance,
    amountCents,
    confirmInsufficient(formData),
  );
  if (warning) return warning;

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

/**
 * Records the pending part of a planned funding step as done today.
 * The user chooses the origin account; the plan only suggests one.
 */
export async function completeTransferStep(
  periodId: string,
  toAccountId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  if (!(await isPeriodOpen(user.id, periodId))) return { error: CLOSED_PERIOD_ERROR };

  const parsed = parseFormData(completeStepSchema, formData);
  if (!parsed.success) return parsed.state;
  const { fromAccountId } = parsed.data;

  if (!(await isOwnedAccount(user.id, fromAccountId))) {
    return { fieldErrors: { fromAccountId: ["Cuenta inválida"] } };
  }
  if (!(await isOwnedAccount(user.id, toAccountId))) {
    return { error: "Cuenta de destino inválida" };
  }

  const fromAccount = await getAccount(user.id, fromAccountId);
  if (fromAccount?.type === "credit") {
    return { fieldErrors: { fromAccountId: ["El origen no puede ser una tarjeta de crédito"] } };
  }

  const { steps } = await getTransferPlan(user.id, periodId);
  const step = steps.find((candidate) => candidate.toAccountId === toAccountId);
  const pendingCents = step ? step.amountCents - step.doneCents : 0;
  if (pendingCents <= 0) return { error: "Este fondeo ya está completo" };

  if (fromAccountId === toAccountId) {
    await setAsidePendingForAccount(user.id, periodId, toAccountId);
    redirect("/");
  }

  const balance = await getPlannedBalance(user.id, fromAccountId);
  const warning = insufficientBalanceState(
    balance,
    pendingCents,
    confirmInsufficient(formData),
  );
  if (warning) return warning;

  await fundAccountStep({
    userId: user.id,
    periodId,
    fromAccountId,
    toAccountId,
    pendingCents,
    occurredOn: todayIsoDate(),
  });
  redirect("/");
}
