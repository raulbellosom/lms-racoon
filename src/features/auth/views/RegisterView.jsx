import React from "react";
import { useTranslation } from "react-i18next";
import { AuthLayout } from "../components/AuthLayout";
import { RegisterForm } from "../components/RegisterForm";
import { AuthFooter } from "../components/AuthCard";

/**
 * Register view - Premium split-screen auth page
 */
export function RegisterView() {
  const { t } = useTranslation();

  return (
    <AuthLayout
      title={t("auth.registerTitle", "Crea tu cuenta")}
      subtitle={t(
        "auth.registerSubtitle",
        "Únete a nuestra comunidad de aprendizaje",
      )}
      sideTitle={t("auth.registerSideTitle", "Únete a la comunidad")}
      sideDescription={t(
        "auth.registerSideDesc",
        "Descubre una nueva forma de aprender, conectar y crecer profesionalmente.",
      )}
    >
      <RegisterForm />
      <AuthFooter
        text={t("auth.hasAccount", "¿Ya tienes cuenta?")}
        linkText={t("auth.loginButton", "Iniciar sesión")}
        linkTo="/auth/login"
      />
    </AuthLayout>
  );
}
