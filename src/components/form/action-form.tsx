"use client";

import {
  createContext,
  startTransition,
  use,
  useActionState,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/utils";

type FormContextValue = { state: FormState; pending: boolean };

const FormContext = createContext<FormContextValue>({ state: {}, pending: false });

export function useFormContext() {
  return use(FormContext);
}

export function useFieldError(name: string): string | undefined {
  return useFormContext().state.fieldErrors?.[name]?.[0];
}

type ActionFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
  /** When set, asks for confirmation before submitting. */
  confirmMessage?: string;
};

/**
 * Submits through a Server Action and exposes its errors to the fields below it.
 * Submitting via onSubmit (instead of the `action` prop) keeps user input when validation fails.
 */
export function ActionForm({ action, children, className, confirmMessage }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingFormData = useRef<FormData | null>(null);
  const startedRef = useRef(false);

  function submit(formData: FormData) {
    if (startedRef.current) return;
    startedRef.current = true;
    startTransition(() => {
      formAction(formData);
      startedRef.current = false;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || startedRef.current) return;
    const formData = new FormData(event.currentTarget);
    if (confirmMessage) {
      pendingFormData.current = formData;
      setConfirmOpen(true);
      return;
    }
    submit(formData);
  }

  return (
    <FormContext value={{ state, pending }}>
      <form onSubmit={handleSubmit} noValidate className={cn("flex flex-col gap-4", className)}>
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.warning && (
          <Alert>
            <AlertDescription className="flex flex-col gap-2">
              <span>{state.warning}</span>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="confirmInsufficient"
                  value="1"
                  className="size-4 accent-primary"
                  required
                />
                Confirmo continuar con saldo insuficiente
              </label>
            </AlertDescription>
          </Alert>
        )}
        {children}
      </form>
      {confirmMessage && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={(open) => {
            setConfirmOpen(open);
            if (!open) pendingFormData.current = null;
          }}
          message={confirmMessage}
          onConfirm={() => {
            const formData = pendingFormData.current;
            pendingFormData.current = null;
            if (formData) submit(formData);
          }}
        />
      )}
    </FormContext>
  );
}
