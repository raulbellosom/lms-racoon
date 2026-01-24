import React from "react";
import { useTranslation } from "react-i18next";
import { AuthLayout } from "../components/AuthLayout";
import { LoginForm } from "../components/LoginForm";
import { AuthFooter } from "../components/AuthCard";

/**
 * Login view - Premium split-screen auth page
 */
export function LoginView() {
  const { t } = useTranslation();

  return (
    <AuthLayout
      title={t("auth.loginTitle", "Inicia sesión")}
      subtitle={t(
        "auth.loginSubtitle",
        "Accede a tu cuenta para continuar aprendiendo",
      )}
      sideTitle={t("auth.loginSideTitle", "Tu futuro empieza aquí")}
      sideDescription={t(
        "auth.loginSideDesc",
        "Accede a miles de cursos y mejora tus habilidades con nuestra plataforma líder.",
      )}
    >
      <LoginForm />
      <AuthFooter
        text={t("auth.noAccount", "¿No tienes cuenta?")}
        linkText={t("auth.createAccount", "Crear cuenta gratis")}
        linkTo="/auth/register"
      />
    </AuthLayout>
  );
}
