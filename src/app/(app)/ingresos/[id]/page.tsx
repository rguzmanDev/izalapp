import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form/delete-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toAccountOptions } from "@/features/accounts/format";
import { removeIncome, saveIncome } from "@/features/incomes/actions";
import { IncomeForm } from "@/features/incomes/components/income-form";
import { getIncome } from "@/features/incomes/data";
import { requireUser } from "@/lib/session";

export default async function EditIncomePage({ params }: PageProps<"/ingresos/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const [income, accounts] = await Promise.all([getIncome(user.id, id), listAccounts(user.id)]);
  if (!income) notFound();

  const depositAccounts = accounts.filter((account) => account.type !== "credit");

  return (
    <>
      <PageHeader title={income.name} backHref="/ingresos" />
      <IncomeForm
        action={saveIncome.bind(null, income.id)}
        income={income}
        accountOptions={toAccountOptions(depositAccounts)}
      />
      <DeleteButton
        action={removeIncome.bind(null, income.id)}
        confirmMessage={`¿Eliminar el ingreso "${income.name}"?`}
      />
    </>
  );
}
