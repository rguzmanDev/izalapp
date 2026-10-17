import Link from "next/link";
import { ActionForm } from "@/components/form/action-form";
import { TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp } from "@/features/auth/actions";
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/limits";

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ActionForm action={signUp}>
          <TextField
            name="name"
            label="Nombre"
            required
            autoComplete="name"
            maxLength={NAME_MAX_LENGTH}
          />
          <TextField
            name="email"
            label="Correo"
            required
            type="email"
            autoComplete="email"
            maxLength={EMAIL_MAX_LENGTH}
          />
          <TextField
            name="password"
            label="Contraseña"
            required
            type="password"
            autoComplete="new-password"
            hint={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
            maxLength={PASSWORD_MAX_LENGTH}
          />
          <SubmitButton>Crear cuenta</SubmitButton>
        </ActionForm>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary underline underline-offset-4">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
