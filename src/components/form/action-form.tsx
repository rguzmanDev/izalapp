"use client";

import { createContext, startTransition, use, useActionState, type ReactNode } from "react";
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
};

/**
 * Submits through a Server Action and exposes its errors to the fields below it.
 * Submitting via onSubmit (instead of the `action` prop) keeps user input when validation fails.
 */
export function ActionForm({ action, children, className }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <FormContext value={{ state, pending }}>
      <form onSubmit={handleSubmit} noValidate className={cn("flex flex-col gap-4", className)}>
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {children}
      </form>
    </FormContext>
  );
}
