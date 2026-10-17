import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form/delete-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toMoneyAccountOptions } from "@/features/accounts/format";
import { removeIncome, saveIncome } from "@/features/incomes/actions";
import { IncomeForm } from "@/features/incomes/components/income-form";
import { getIncome } from "@/features/incomes/data";
import { sourceUsedInPeriod } from "@/features/periods/locks";
import { requireUser } from "@/lib/session";

export default async function EditIncomePage({ params }: PageProps<"/ingresos/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const [income, accounts] = await Promise.all([getIncome(user.id, id), listAccounts(user.id)]);
  if (!income) notFound();

  const used = await sourceUsedInPeriod(user.id, id);

  return (
    <>
      <PageHeader title={income.name} backHref="/ingresos" />
      <IncomeForm
        action={saveIncome.bind(null, income.id)}
        income={income}
        accountOptions={toMoneyAccountOptions(accounts)}
      />
      {used ? (
        <p className="text-sm text-muted-foreground">
          No se puede eliminar: ya se usó en una quincena. Desactívalo si ya no aplica.
        </p>
      ) : (
        <DeleteButton
          action={removeIncome.bind(null, income.id)}
          confirmMessage={`¿Eliminar el ingreso "${income.name}"?`}
        />
      )}
    </>
  );
}
