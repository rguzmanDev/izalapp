import Link from "next/link";
import { DesktopNav, MobileNav } from "@/components/app-nav";
import { SignOutButton } from "@/components/sign-out-button";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
          <Link
            href="/"
            className="font-heading text-[1.2rem] font-semibold tracking-[-0.02em] text-primary"
          >
            IzalApp
          </Link>
          <DesktopNav />
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pt-6 pb-40 md:pb-28">
        {children}
      </main>
      <MobileNav />
    </>
  );
}
