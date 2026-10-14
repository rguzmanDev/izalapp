import { ActionForm } from "@/components/form/action-form";
import { MoneyField, SelectField, type SelectOption } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import type { FormState } from "@/lib/form";

type ClosePeriodFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  surplusCents: number;
  defaultFromAccountId?: string;
  defaultToAccountId?: string;
  accountOptions: SelectOption[];
};

export function ClosePeriodForm({
  action,
  surplusCents,
  defaultFromAccountId,
  defaultToAccountId,
  accountOptions,
}: ClosePeriodFormProps) {
  return (
    <ActionForm action={action}>
      <MoneyField
        name="surplusCents"
        label="¿Cuánto vas a mover?"
        optional
        hint="Déjalo vacío para cerrar sin mover dinero."
        defaultCents={surplusCents > 0 ? surplusCents : null}
      />
      <SelectField
        name="fromAccountId"
        label="Desde"
        placeholder="Selecciona una cuenta"
        options={accountOptions}
        defaultValue={defaultFromAccountId ?? ""}
      />
      <SelectField
        name="toAccountId"
        label="Hacia"
        placeholder="Selecciona una cuenta"
        options={accountOptions}
        defaultValue={defaultToAccountId ?? ""}
      />
      <SubmitButton>Cerrar quincena</SubmitButton>
    </ActionForm>
  );
}
