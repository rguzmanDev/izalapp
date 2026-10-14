"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/** Submit button for plain Server Action forms; disables itself while the action runs. */
export function PendingButton(props: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} {...props} />;
}
