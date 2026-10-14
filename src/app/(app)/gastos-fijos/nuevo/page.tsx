import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toAccountOptions } from "@/features/accounts/format";
import { saveFixedExpense } from "@/features/fixed-expenses/actions";
import { FixedExpenseForm } from "@/features/fixed-expenses/components/fixed-expense-form";
import { requireUser } from "@/lib/session";

export default async function NewFixedExpensePage() {
  const user = await requireUser();
  const accounts = await listAccounts(user.id);

  return (
    <>
      <PageHeader title="Nuevo gasto fijo" backHref="/gastos-fijos" />
      <FixedExpenseForm
        action={saveFixedExpense.bind(null, null)}
        accountOptions={toAccountOptions(accounts)}
      />
    </>
  );
}
