"use client";

import { useState } from "react";
import { DownloadIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExportCsvButton({ range }: { range: number }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/reportes/export?quincenas=${range}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `izalapp-reportes-${range}q.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo exportar. Intenta de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9 gap-1.5")}
      >
        <DownloadIcon className="size-3.5" />
        {pending ? "Exportando…" : "CSV"}
      </button>
      {error && <span className="max-w-48 text-right text-[11px] text-destructive">{error}</span>}
    </div>
  );
}
