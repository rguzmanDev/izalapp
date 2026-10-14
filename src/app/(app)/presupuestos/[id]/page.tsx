import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form/delete-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toAccountOptions } from "@/features/accounts/format";
import { removeBudget, saveBudget } from "@/features/budgets/actions";
import { BudgetForm } from "@/features/budgets/components/budget-form";
import { getBudget } from "@/features/budgets/data";
import { requireUser } from "@/lib/session";

export default async function EditBudgetPage({ params }: PageProps<"/presupuestos/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const [budget, accounts] = await Promise.all([getBudget(user.id, id), listAccounts(user.id)]);
  if (!budget) notFound();

  return (
    <>
      <PageHeader title={budget.name} backHref="/presupuestos" />
      <BudgetForm
        action={saveBudget.bind(null, budget.id)}
        budget={budget}
        accountOptions={toAccountOptions(accounts)}
      />
      <DeleteButton
        action={removeBudget.bind(null, budget.id)}
        confirmMessage={`¿Eliminar el presupuesto "${budget.name}"?`}
      />
    </>
  );
}
