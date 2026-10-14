import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

/** Returns the signed-in user or redirects to the login page. Call it in every page and Server Action. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}
