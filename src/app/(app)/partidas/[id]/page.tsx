import { notFound } from "next/navigation";
import { ActionForm } from "@/components/form/action-form";
import { DeleteButton } from "@/components/form/delete-button";
import { MoneyField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { PageHeader } from "@/components/page-header";
import { removeExtraIncome, savePeriodItem } from "@/features/periods/actions";
import { isExtraIncome } from "@/features/periods/constants";
import { getPeriodItem } from "@/features/periods/data";
import { requireUser } from "@/lib/session";

const KIND_LABELS = {
  income: "Ingreso",
  fixed_expense: "Gasto fijo",
  budget: "Presupuesto",
} as const;

export default async function EditPeriodItemPage({ params }: PageProps<"/partidas/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const item = await getPeriodItem(user.id, id);
  if (!item) notFound();

  const isExtra = isExtraIncome(item);

  return (
    <>
      <PageHeader
        title={item.name}
        description={
          isExtra
            ? "Ingreso extra · solo cuenta en esta quincena"
            : `${KIND_LABELS[item.kind]} · el cambio solo aplica a esta quincena`
        }
        backHref="/"
      />
      <ActionForm action={savePeriodItem.bind(null, item.id)}>
        <MoneyField
          name="plannedCents"
          label="Monto en esta quincena"
          defaultCents={item.plannedCents}
        />
        <SubmitButton>Guardar</SubmitButton>
      </ActionForm>
      {isExtra && (
        <DeleteButton
          action={removeExtraIncome.bind(null, item.id)}
          confirmMessage="¿Eliminar este ingreso extra?"
        />
      )}
    </>
  );
}
