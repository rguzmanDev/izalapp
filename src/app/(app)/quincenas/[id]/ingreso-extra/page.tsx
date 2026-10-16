import { notFound, redirect } from "next/navigation";
import { ActionForm } from "@/components/form/action-form";
import { MoneyField, SelectField, TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toMoneyAccountOptions } from "@/features/accounts/format";
import { saveExtraIncome } from "@/features/periods/actions";
import { getPeriod, listPeriodItems } from "@/features/periods/data";
import { NAME_MAX_LENGTH } from "@/lib/limits";
import { periodLabel, toPeriodKey } from "@/lib/period";
import { requireUser } from "@/lib/session";

export default async function ExtraIncomePage({ params }: PageProps<"/quincenas/[id]/ingreso-extra">) {
  const { id } = await params;
  const user = await requireUser();
  const period = await getPeriod(user.id, id);
  if (!period) notFound();
  if (period.status === "closed") redirect("/");

  const [rows, accounts] = await Promise.all([
    listPeriodItems(user.id, period.id),
    listAccounts(user.id),
  ]);
  const moneyOptions = toMoneyAccountOptions(accounts);
  const incomeAccountId = rows.find(({ item }) => item.kind === "income")?.item.accountId;
  const defaultAccountId =
    incomeAccountId && moneyOptions.some((option) => option.value === incomeAccountId)
      ? incomeAccountId
      : "";

  return (
    <>
      <PageHeader
        title="Ingreso extra"
        description={`Ingreso fuera de tu plan fijo. Solo cuenta en la ${periodLabel(toPeriodKey(period))}.`}
        backHref="/"
      />
      <ActionForm
        action={saveExtraIncome.bind(null, period.id)}
        confirmMessage="¿Registrar este ingreso extra?"
      >
        <TextField
          name="name"
          label="Concepto"
          required
          placeholder="Concepto del ingreso"
          maxLength={NAME_MAX_LENGTH}
        />
        <MoneyField name="plannedCents" label="Monto" required />
        <SelectField
          name="accountId"
          label="Se depositó en"
          required
          placeholder="Selecciona una cuenta"
          options={moneyOptions}
          defaultValue={defaultAccountId}
        />
        <SubmitButton>Guardar</SubmitButton>
      </ActionForm>
    </>
  );
}
