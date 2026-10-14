"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useFormContext } from "./action-form";

export function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormContext();

  return (
    <Button type="submit" size="lg" className="h-10" disabled={pending}>
      {pending ? "Guardando…" : children}
    </Button>
  );
}
