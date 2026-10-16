import { PageHeader } from "@/components/page-header";
import { listAccounts } from "@/features/accounts/data";
import { toMoneyAccountOptions } from "@/features/accounts/format";
import { saveTransfer } from "@/features/transfers/actions";
import { TransferForm } from "@/features/transfers/components/transfer-form";
import { todayIsoDate } from "@/lib/period";
import { requireUser } from "@/lib/session";

const single = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** Prefill: ?desde=<accountId>&hacia=<accountId>&monto=<cents>. */
export default async function NewTransferPage({ searchParams }: PageProps<"/transferencias/nueva">) {
  const query = await searchParams;
  const user = await requireUser();
  const accounts = await listAccounts(user.id);
  const moneyAccounts = accounts.filter((account) => account.type !== "credit");
  const ownedAccount = (id: string | undefined) =>
    moneyAccounts.some((account) => account.id === id) ? id : undefined;
  const amountCents = Number(single(query.monto));

  return (
    <>
      <PageHeader
        title="Nueva transferencia"
        description="Dinero que mueves entre tus cuentas bancarias o efectivo; no cuenta como gasto."
        backHref="/movimientos"
      />
      <TransferForm
        action={saveTransfer.bind(null, null)}
        defaults={{
          occurredOn: todayIsoDate(),
          fromAccountId: ownedAccount(single(query.desde)),
          toAccountId: ownedAccount(single(query.hacia)),
          amountCents: Number.isInteger(amountCents) && amountCents > 0 ? amountCents : undefined,
        }}
        accountOptions={toMoneyAccountOptions(accounts)}
      />
    </>
  );
}
