import { cn } from "@/lib/utils";

type FaroMarkProps = {
  className?: string;
  /** Soft pulse on the beacon — use sparingly (brand only). */
  glow?: boolean;
};

/** Geometric nod to Volcán de Izalco — “Faro del Pacífico”. */
export function FaroMark({ className, glow = false }: FaroMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("size-7 text-primary", className)}
    >
      {glow && (
        <circle
          cx="16"
          cy="7"
          r="5"
          className="fill-primary/20 animate-[faro-pulse_3.2s_ease-in-out_infinite]"
        />
      )}
      <path
        d="M16 4.5 L26.5 26.5 H5.5 Z"
        className="fill-primary/15 stroke-primary"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 4.5 L20.5 15 H11.5 Z"
        className="fill-primary/35"
      />
      <circle cx="16" cy="7" r="1.6" className="fill-primary" />
      <path
        d="M8 26.5 H24"
        className="stroke-primary/40"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
