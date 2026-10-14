import Link from "next/link";
import { ActionForm } from "@/components/form/action-form";
import { TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp } from "@/features/auth/actions";

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ActionForm action={signUp}>
          <TextField name="name" label="Nombre" autoComplete="name" />
          <TextField name="email" label="Correo" type="email" autoComplete="email" />
          <TextField
            name="password"
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            hint="Mínimo 8 caracteres"
          />
          <SubmitButton>Crear cuenta</SubmitButton>
        </ActionForm>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
