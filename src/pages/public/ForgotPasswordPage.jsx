import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { functions } from "../../shared/appwrite/client";
import { APPWRITE } from "../../shared/appwrite/ids";
import { Input } from "../../shared/ui/Input";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { useToast } from "../../app/providers/ToastProvider";

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const { showToast } = useToast();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const execution = await functions.createExecution(
        APPWRITE.functions.authHandler,
        JSON.stringify({
          action: "request_recovery",
          email: data.email,
        }),
        false,
      );

      const response = JSON.parse(execution.responseBody);
      if (response.success) {
        setIsSent(true);
        showToast("Correo de recuperación enviado", "success");
      } else {
        showToast(response.message || "Error al enviar correo", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Error de conexión", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-main))] p-4">
      <Card className="w-full max-w-md p-8">
        <Link
          to="/login"
          className="mb-6 flex items-center text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--brand-primary))]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio de sesión
        </Link>

        {isSent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Mail className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-[rgb(var(--text-primary))]">
              ¡Correo Enviado!
            </h2>
            <p className="mb-6 text-[rgb(var(--text-secondary))]">
              Hemos enviado las instrucciones para restablecer tu contraseña a
              tu correo electrónico. Revisa tu bandeja de entrada (y spam).
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setIsSent(false)}
            >
              Intentar con otro correo
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                Recuperar Contraseña
              </h1>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                Ingresa tu correo electrónico y te enviaremos un enlace para
                restablecer tu contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[rgb(var(--text-secondary))]">
                  Correo Electrónico
                </label>
                <Input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  className={errors.email ? "border-red-500" : ""}
                  {...register("email", {
                    required: "El correo es requerido",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Correo inválido",
                    },
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Enlace"
                )}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
