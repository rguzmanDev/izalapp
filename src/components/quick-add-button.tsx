import Link from "next/link";
import { PlusIcon } from "lucide-react";

export function QuickAddButton({ href = "/movimientos/nuevo" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Registrar gasto"
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 md:bottom-8"
    >
      <PlusIcon className="size-6" />
    </Link>
  );
}
