import Link from "next/link";
import { ActionForm } from "@/components/form/action-form";
import { TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/features/auth/actions";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ActionForm action={signIn}>
          <TextField name="email" label="Correo" type="email" autoComplete="email" />
          <TextField
            name="password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
          />
          <SubmitButton>Entrar</SubmitButton>
        </ActionForm>
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-foreground underline underline-offset-4">
            Regístrate
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
