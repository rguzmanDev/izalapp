import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toAccountOptions } from "@/features/accounts/format";
import { saveBudget } from "@/features/budgets/actions";
import { BudgetForm } from "@/features/budgets/components/budget-form";
import { requireUser } from "@/lib/session";

export default async function NewBudgetPage() {
  const user = await requireUser();
  const accounts = await listAccounts(user.id);

  return (
    <>
      <PageHeader title="Nuevo presupuesto" backHref="/presupuestos" />
      <BudgetForm action={saveBudget.bind(null, null)} accountOptions={toAccountOptions(accounts)} />
    </>
  );
}
