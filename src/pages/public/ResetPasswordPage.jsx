import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Loader2, ArrowLeft, KeyRound, CheckCircle } from "lucide-react";
import { functions } from "../../shared/appwrite/client";
import { APPWRITE } from "../../shared/appwrite/ids";
import { Input } from "../../shared/ui/Input";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { useToast } from "../../app/providers/ToastProvider";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const { showToast } = useToast();
  const password = watch("password");

  React.useEffect(() => {
    if (!userId || !token) {
      showToast("Enlace inválido o incompleto", "error");
      // navigate("/login"); // Optional: redirect immediately or let them see the error
    }
  }, [userId, token, showToast]);

  const onSubmit = async (data) => {
    if (!userId || !token) return;

    setIsLoading(true);
    try {
      const execution = await functions.createExecution(
        APPWRITE.functions.authHandler,
        JSON.stringify({
          action: "update_password",
          userId,
          token,
          newPassword: data.password,
        }),
        false,
      );

      const response = JSON.parse(execution.responseBody);
      if (response.success) {
        setIsSuccess(true);
        showToast("Contraseña actualizada correctamente", "success");
        setTimeout(() => {
          navigate("/auth/login");
        }, 3000);
      } else {
        showToast(
          response.message || "Error al actualizar contraseña",
          "error",
        );
      }
    } catch (error) {
      console.error(error);
      showToast("Error de conexión", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-main))] p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="text-xl font-bold text-red-500">Enlace Inválido</h2>
          <p className="mt-2 text-[rgb(var(--text-secondary))]">
            El enlace que has utilizado no contiene la información necesaria.
            Por favor solicita uno nuevo.
          </p>
          <div className="mt-6">
            <Link to="/forgot-password">
              <Button>Solicitar Nuevo Enlace</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg-main))] p-4">
      <Card className="w-full max-w-md p-8">
        {isSuccess ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-[rgb(var(--text-primary))]">
              ¡Contraseña Actualizada!
            </h2>
            <p className="mb-6 text-[rgb(var(--text-secondary))]">
              Tu contraseña ha sido cambiada exitosamente. Serás redirigido al
              login en unos segundos...
            </p>
            <Link to="/auth/login">
              <Button className="w-full">Ir al Login ahora</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--bg-muted))] text-[rgb(var(--brand-primary))]">
                <KeyRound className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                Nueva Contraseña
              </h1>
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                Ingresa tu nueva contraseña para la cuenta.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[rgb(var(--text-secondary))]">
                  Nueva Contraseña
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...register("password", {
                    required: "La contraseña es requerida",
                    minLength: {
                      value: 8,
                      message: "Mínimo 8 caracteres",
                    },
                  })}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[rgb(var(--text-secondary))]">
                  Confirmar Contraseña
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword", {
                    required: "Confirma tu contraseña",
                    validate: (val) =>
                      val === password || "Las contraseñas no coinciden",
                  })}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Contraseña"
                )}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
