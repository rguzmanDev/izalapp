"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FuelIcon, PlusIcon, ReceiptIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickAddButtonProps = {
  href?: string;
  /** When set, + opens a menu with gasto and carga. */
  fuelHref?: string;
};

export function QuickAddButton({ href = "/movimientos/nuevo", fuelHref }: QuickAddButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (!fuelHref) {
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

  return (
    <div
      ref={rootRef}
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex flex-col items-end gap-2 md:bottom-8"
    >
      {open && (
        <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-2 shadow-lg">
          <Link
            href={href}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
          >
            <ReceiptIcon className="size-4" />
            Gasto
          </Link>
          <Link
            href={fuelHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
          >
            <FuelIcon className="size-4" />
            Carga de gasolina
          </Link>
        </div>
      )}
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Agregar gasto o carga"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95",
          open && "rotate-45",
        )}
      >
        <PlusIcon className="size-6" />
      </button>
    </div>
  );
}
