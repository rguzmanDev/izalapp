import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  if (await getSession()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <p className="text-center text-xl font-semibold tracking-tight">IzalApp</p>
        {children}
      </div>
    </main>
  );
}
