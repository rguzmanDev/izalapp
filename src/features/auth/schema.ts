import { z } from "zod";
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/limits";
import { requiredText } from "@/lib/validation";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, "Correo demasiado largo")
  .pipe(z.email("Correo inválido"));

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Requerido").max(PASSWORD_MAX_LENGTH, "Contraseña inválida"),
});

export const signUpSchema = z.object({
  name: requiredText,
  email,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`)
    .max(PASSWORD_MAX_LENGTH, `Máximo ${PASSWORD_MAX_LENGTH} caracteres`),
});
