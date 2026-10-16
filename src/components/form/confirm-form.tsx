"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/form/confirm-dialog";
import { cn } from "@/lib/utils";

type ConfirmFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  children: ReactNode;
  className?: string;
  confirmLabel?: string;
  destructive?: boolean;
};

/** Form that asks for in-app confirmation before submitting a Server Action. */
export function ConfirmForm({
  action,
  confirmMessage,
  children,
  className,
  confirmLabel,
  destructive,
}: ConfirmFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const startedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function runAction() {
    if (startedRef.current) return;
    startedRef.current = true;
    const formData = new FormData(formRef.current ?? undefined);
    startTransition(async () => {
      try {
        await action(formData);
      } finally {
        startedRef.current = false;
      }
    });
  }

  return (
    <>
      <form
        ref={formRef}
        className={cn(className)}
        onSubmit={(event) => {
          event.preventDefault();
          if (isPending || startedRef.current) return;
          setOpen(true);
        }}
      >
        <fieldset disabled={isPending} className="contents">
          {children}
        </fieldset>
      </form>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        destructive={destructive}
        onConfirm={() => {
          setOpen(false);
          runAction();
        }}
      />
    </>
  );
}
