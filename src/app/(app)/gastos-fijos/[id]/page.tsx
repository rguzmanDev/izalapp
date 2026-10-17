import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form/delete-button";
import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toMoneyAccountOptions } from "@/features/accounts/format";
import { removeFixedExpense, saveFixedExpense } from "@/features/fixed-expenses/actions";
import { FixedExpenseForm } from "@/features/fixed-expenses/components/fixed-expense-form";
import { getFixedExpense } from "@/features/fixed-expenses/data";
import { sourceUsedInPeriod } from "@/features/periods/locks";
import { requireUser } from "@/lib/session";

export default async function EditFixedExpensePage({ params }: PageProps<"/gastos-fijos/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const [expense, accounts] = await Promise.all([
    getFixedExpense(user.id, id),
    listAccounts(user.id),
  ]);
  if (!expense) notFound();

  const lockStructure = await sourceUsedInPeriod(user.id, id);

  return (
    <>
      <PageHeader title={expense.name} backHref="/gastos-fijos" />
      <FixedExpenseForm
        action={saveFixedExpense.bind(null, expense.id)}
        expense={expense}
        accountOptions={toMoneyAccountOptions(accounts)}
        lockStructure={lockStructure}
      />
      {lockStructure ? (
        <p className="text-sm text-muted-foreground">
          No se puede eliminar: ya se usó en una quincena. Desactívalo si ya no aplica.
        </p>
      ) : (
        <DeleteButton
          action={removeFixedExpense.bind(null, expense.id)}
          confirmMessage={`¿Eliminar el gasto fijo "${expense.name}"?`}
        />
      )}
    </>
  );
}
