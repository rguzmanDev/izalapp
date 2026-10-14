"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { parseFormData, type FormState } from "@/lib/form";
import { signInSchema, signUpSchema } from "./schema";

export async function signIn(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseFormData(signInSchema, formData);
  if (!parsed.success) return parsed.state;

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    if (isAPIError(error)) return { error: "Correo o contraseña incorrectos" };
    throw error;
  }
  redirect("/");
}

export async function signUp(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseFormData(signUpSchema, formData);
  if (!parsed.success) return parsed.state;

  try {
    await auth.api.signUpEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    if (isAPIError(error)) return { error: "No se pudo crear la cuenta. Verifica tus datos." };
    throw error;
  }
  redirect("/");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
