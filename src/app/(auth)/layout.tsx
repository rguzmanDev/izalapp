import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  if (await getSession()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="font-heading text-[1.75rem] font-semibold tracking-[-0.02em] text-primary">
            IzalApp
          </p>
          <p className="text-sm text-muted-foreground">Planeación quincenal · Izalco</p>
        </div>
        {children}
      </div>
    </main>
  );
}
