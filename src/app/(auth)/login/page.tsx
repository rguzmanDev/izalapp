import Link from "next/link";
import { ActionForm } from "@/components/form/action-form";
import { TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/features/auth/actions";
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/limits";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ActionForm action={signIn}>
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
            autoComplete="current-password"
            maxLength={PASSWORD_MAX_LENGTH}
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
