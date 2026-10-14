"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumnIcon,
  FuelIcon,
  HouseIcon,
  ListIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; sections?: string[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", icon: HouseIcon, sections: ["/partidas", "/quincenas"] },
  { href: "/movimientos", label: "Movimientos", icon: ListIcon, sections: ["/transferencias"] },
  { href: "/gasolina", label: "Gasolina", icon: FuelIcon },
  { href: "/reportes", label: "Reportes", icon: ChartColumnIcon },
  {
    href: "/ajustes",
    label: "Ajustes",
    icon: SettingsIcon,
    sections: ["/cuentas", "/ingresos", "/gastos-fijos", "/presupuestos", "/plan"],
  },
];

function useIsActive() {
  const pathname = usePathname();
  const isWithin = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return ({ href, sections = [] }: NavItem) =>
    (href === "/" ? pathname === "/" : isWithin(href)) || sections.some(isWithin);
}

export function DesktopNav() {
  const isActive = useIsActive();

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
            isActive(item) && "bg-muted text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav() {
  const isActive = useIsActive();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground",
                isActive(item) && "text-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
