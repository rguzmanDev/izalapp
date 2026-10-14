import { z } from "zod";
import { requiredText } from "@/lib/validation";

const email = z.string().trim().toLowerCase().pipe(z.email("Correo inválido"));

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Requerido"),
});

export const signUpSchema = z.object({
  name: requiredText,
  email,
  password: z.string().min(8, "Mínimo 8 caracteres").max(128, "Máximo 128 caracteres"),
});
