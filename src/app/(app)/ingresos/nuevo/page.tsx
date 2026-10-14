import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toAccountOptions } from "@/features/accounts/format";
import { saveIncome } from "@/features/incomes/actions";
import { IncomeForm } from "@/features/incomes/components/income-form";
import { requireUser } from "@/lib/session";

export default async function NewIncomePage() {
  const user = await requireUser();
  const accounts = await listAccounts(user.id);
  const depositAccounts = accounts.filter((account) => account.type !== "credit");

  return (
    <>
      <PageHeader title="Nuevo ingreso" backHref="/ingresos" />
      <IncomeForm
        action={saveIncome.bind(null, null)}
        accountOptions={toAccountOptions(depositAccounts)}
      />
    </>
  );
}
