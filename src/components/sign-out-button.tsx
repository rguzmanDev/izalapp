"use client";

import { LogOutIcon } from "lucide-react";
import { ConfirmForm } from "@/components/form/confirm-form";
import { PendingButton } from "@/components/form/pending-button";
import { signOut } from "@/features/auth/actions";

export function SignOutButton() {
  return (
    <ConfirmForm action={signOut} confirmMessage="¿Cerrar sesión?" confirmLabel="Salir">
      <PendingButton type="submit" variant="ghost" size="sm">
        <LogOutIcon />
        Salir
      </PendingButton>
    </ConfirmForm>
  );
}
