"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form";

type DeleteButtonProps = {
  action: (state: FormState) => Promise<FormState>;
  confirmMessage: string;
};

export function DeleteButton({ action, confirmMessage }: DeleteButtonProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
      className="flex flex-col gap-2"
    >
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="destructive" size="lg" className="h-10" disabled={pending}>
        {pending ? "Eliminando…" : "Eliminar"}
      </Button>
    </form>
  );
}
