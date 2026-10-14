import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/form/delete-button";
import { PageHeader } from "@/components/page-header";
import { removeAccount, saveAccount } from "@/features/accounts/actions";
import { AccountForm } from "@/features/accounts/components/account-form";
import { getAccount, listAccounts } from "@/features/accounts/data";
import { toAccountOptions } from "@/features/accounts/format";
import { requireUser } from "@/lib/session";

export default async function EditAccountPage({ params }: PageProps<"/cuentas/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const [account, accounts] = await Promise.all([getAccount(user.id, id), listAccounts(user.id)]);
  if (!account) notFound();

  const paymentAccounts = accounts.filter((other) => other.type !== "credit" && other.id !== id);

  return (
    <>
      <PageHeader title={account.name} backHref="/cuentas" />
      <AccountForm
        action={saveAccount.bind(null, account.id)}
        account={account}
        paymentAccountOptions={toAccountOptions(paymentAccounts)}
      />
      <DeleteButton
        action={removeAccount.bind(null, account.id)}
        confirmMessage={`¿Eliminar la cuenta "${account.name}"?`}
      />
    </>
  );
}
