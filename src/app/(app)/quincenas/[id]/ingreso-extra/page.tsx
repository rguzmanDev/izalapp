import { notFound, redirect } from "next/navigation";
import { ActionForm } from "@/components/form/action-form";
import { MoneyField, SelectField, TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toAccountOptions } from "@/features/accounts/format";
import { saveExtraIncome } from "@/features/periods/actions";
import { getPeriod, listPeriodItems } from "@/features/periods/data";
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
  const incomeAccountId = rows.find(({ item }) => item.kind === "income")?.item.accountId;

  return (
    <>
      <PageHeader
        title="Ingreso extra"
        description={`Bono, trabajo extra o cualquier ingreso fuera de tu plan. Solo cuenta en la ${periodLabel(toPeriodKey(period))}.`}
        backHref="/"
      />
      <ActionForm action={saveExtraIncome.bind(null, period.id)}>
        <TextField name="name" label="Concepto" placeholder="Bono" />
        <MoneyField name="plannedCents" label="Monto" />
        <SelectField
          name="accountId"
          label="Se depositó en"
          placeholder="Selecciona una cuenta"
          options={toAccountOptions(accounts)}
          defaultValue={incomeAccountId ?? ""}
        />
        <SubmitButton>Guardar</SubmitButton>
      </ActionForm>
    </>
  );
}
