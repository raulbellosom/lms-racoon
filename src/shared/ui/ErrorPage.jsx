import React from "react";
import { Link, useNavigate, useRouteError } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, LogIn, ArrowLeft, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";
import { useAuth } from "../../app/providers/AuthProvider";

export function ErrorPage({
  code = 404,
  title,
  description,
  showHomeButton = true,
  showBackButton = true,
  showLoginButton = false,
  showRefreshButton = false,
  customActions,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const isAuthenticated = !!auth?.user;

  // Defaults based on code
  if (!title) {
    if (code === 404) title = t("errors.notFound", "Página no encontrada");
    else if (code === 403) title = t("errors.forbidden", "Acceso denegado");
    else if (code === 401) title = t("errors.unauthorized", "Inicia sesión");
    else title = t("errors.serverError", "Error del servidor");
  }

  if (!description) {
    if (code === 404)
      description = t(
        "errors.notFoundDesc",
        "Lo sentimos, la página que buscas no existe.",
      );
    else if (code === 403)
      description = t(
        "errors.forbiddenDesc",
        "No tienes permisos para acceder.",
      );
    else if (code === 401)
      description = t("errors.unauthorizedDesc", "Necesitas iniciar sesión.");
    else description = t("errors.serverErrorDesc", "Algo salió mal.");
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[rgb(var(--bg-base))] px-4 text-center">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute -top-1/4 left-1/4 h-[800px] w-[800px] rounded-full bg-linear-to-br from-[rgb(var(--brand-primary))] to-transparent blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1.1 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1,
          }}
          className="absolute -bottom-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-linear-to-tl from-[rgb(var(--brand-accent))] to-transparent blur-[100px]"
        />
      </div>

      <div className="relative z-10 max-w-2xl px-4 py-8">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 font-black tracking-tighter"
        >
          <span className="bg-linear-to-r from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))] bg-clip-text text-[150px] leading-none text-transparent sm:text-[200px]">
            {code}
          </span>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-10 text-lg text-[rgb(var(--text-secondary))]"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {showHomeButton &&
            (isAuthenticated ? (
              <Button
                size="lg"
                onClick={() => navigate("/app/home")}
                className="gap-2 shadow-lg shadow-[rgb(var(--brand-primary)/0.25)]"
              >
                <Home className="h-5 w-5" />
                {t("nav.home", "Inicio")}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => navigate("/")}
                className="gap-2 shadow-lg shadow-[rgb(var(--brand-primary)/0.25)]"
              >
                <Home className="h-5 w-5" />
                {t("nav.home", "Inicio")}
              </Button>
            ))}

          {showBackButton && (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              {t("common.back", "Regresar")}
            </Button>
          )}

          {showRefreshButton && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCcw className="h-5 w-5" />
              {t("errors.tryAgain", "Reintentar")}
            </Button>
          )}

          {showLoginButton && !isAuthenticated && (
            <Button
              size="lg"
              onClick={() => navigate("/auth/login")}
              className="gap-2"
            >
              <LogIn className="h-5 w-5" />
              {t("common.login", "Iniciar sesión")}
            </Button>
          )}

          {customActions}
        </motion.div>
      </div>
    </div>
  );
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const { t } = useTranslation();

  let code = 500;
  let title;
  let description;

  if (error?.status === 404 || error?.message?.includes("not found")) {
    code = 404;
  } else if (error?.status === 403) {
    code = 403;
  } else if (error?.status === 401) {
    code = 401;
  }

  if (import.meta.env.DEV && error?.message) {
    description = error.message;
  }

  return (
    <ErrorPage
      code={code}
      title={title}
      description={description}
      showBackButton
      showRefreshButton={code === 500}
      showHomeButton
    />
  );
}

import { NotFound } from "./NotFound";

export function NotFoundPage() {
  return <NotFound />;
}

export function ForbiddenPage() {
  return <ErrorPage code={403} showBackButton showHomeButton showLoginButton />;
}

export function UnauthorizedPage() {
  return <ErrorPage code={401} showLoginButton showHomeButton />;
}
