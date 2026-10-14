import Link from "next/link";
import { LogOutIcon } from "lucide-react";
import { DesktopNav, MobileNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
          <Link href="/" className="font-semibold tracking-tight">
            IzalApp
          </Link>
          <DesktopNav />
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOutIcon />
              Salir
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-6 pb-40 md:pb-28">
        {children}
      </main>
      <MobileNav />
    </>
  );
}
