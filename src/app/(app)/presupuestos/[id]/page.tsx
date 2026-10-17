import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form/delete-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toMoneyAccountOptions } from "@/features/accounts/format";
import { removeBudget, saveBudget } from "@/features/budgets/actions";
import { BudgetForm } from "@/features/budgets/components/budget-form";
import { getBudget } from "@/features/budgets/data";
import { sourceAccountLocked, sourceHasFuelLogs } from "@/features/periods/locks";
import { requireUser } from "@/lib/session";

export default async function EditBudgetPage({ params }: PageProps<"/presupuestos/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const [budget, accounts] = await Promise.all([getBudget(user.id, id), listAccounts(user.id)]);
  if (!budget) notFound();

  const [lockAccount, lockFuelOff] = await Promise.all([
    sourceAccountLocked(user.id, id),
    sourceHasFuelLogs(user.id, id),
  ]);

  return (
    <>
      <PageHeader title={budget.name} backHref="/presupuestos" />
      <BudgetForm
        action={saveBudget.bind(null, budget.id)}
        budget={budget}
        accountOptions={toMoneyAccountOptions(accounts)}
        lockAccount={lockAccount}
        lockFuelOff={lockFuelOff}
      />
      <DeleteButton
        action={removeBudget.bind(null, budget.id)}
        confirmMessage={`¿Eliminar el presupuesto "${budget.name}"?`}
      />
    </>
  );
}
