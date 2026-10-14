import { PageHeader } from "@/components/page-header";
import { saveAccount } from "@/features/accounts/actions";
import { AccountForm } from "@/features/accounts/components/account-form";
import { listAccounts } from "@/features/accounts/data";
import { toAccountOptions } from "@/features/accounts/format";
import { requireUser } from "@/lib/session";

export default async function NewAccountPage() {
  const user = await requireUser();
  const accounts = await listAccounts(user.id);
  const paymentAccounts = accounts.filter((account) => account.type !== "credit");

  return (
    <>
      <PageHeader title="Nueva cuenta" backHref="/cuentas" />
      <AccountForm
        action={saveAccount.bind(null, null)}
        paymentAccountOptions={toAccountOptions(paymentAccounts)}
      />
    </>
  );
}
