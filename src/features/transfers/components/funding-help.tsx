"use client";

import { useState } from "react";

export function FundingHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="text-xs text-muted-foreground/80">
      <p>
        Solo lo pendiente de apartar.{" "}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          {open ? "Ocultar" : "¿Cómo funciona?"}
        </button>
      </p>
      {open && (
        <p className="mt-1">
          «Ya lo moví» elige el origen y crea transferencias Apartado por partida. El avance solo
          cuenta esas transferencias (no otras a la misma cuenta).
        </p>
      )}
    </div>
  );
}
