"use client";

import { useActionState, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form";

type DeleteButtonProps = {
  action: (state: FormState) => Promise<FormState>;
  confirmMessage: string;
};

export function DeleteButton({ action, confirmMessage }: DeleteButtonProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const startedRef = useRef(false);
  const [open, setOpen] = useState(false);

  function runAction() {
    if (startedRef.current || pending) return;
    startedRef.current = true;
    formAction();
    startedRef.current = false;
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button
          type="button"
          variant="destructive"
          size="lg"
          className="h-10"
          disabled={pending}
          onClick={() => {
            if (pending || startedRef.current) return;
            setOpen(true);
          }}
        >
          {pending ? "Eliminando…" : "Eliminar"}
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        message={confirmMessage}
        title="Eliminar"
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          setOpen(false);
          runAction();
        }}
      />
    </>
  );
}
