import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Home,
  ArrowLeft,
  Search,
  HelpCircle,
  Compass,
  AlertCircle,
} from "lucide-react";
import { Button } from "./Button";
import appIcon from "../../resources/icon.svg";

export function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-[rgb(var(--bg-base))] px-4 text-center">
      {/* Background Effects - Dynamic Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top-center Red/Primary Glow */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[500px] bg-[rgb(var(--brand-primary)/0.2)] blur-[120px] rounded-full"
        />
        {/* Bottom-right Accent Glow */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-0 right-0 h-[600px] w-[600px] bg-[rgb(var(--brand-accent)/0.15)] blur-[150px] rounded-full"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
        {/* Floating Icon Container */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-8"
        >
          {/* Icon Pulse Ring */}
          <div className="absolute inset-0 -m-4 rounded-full border border-[rgb(var(--brand-primary)/0.2)] animate-pulse-glow" />

          {/* Main Icon Box */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[rgb(var(--bg-elevated))] to-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))] shadow-2xl shadow-[rgb(var(--brand-primary)/0.25)]">
            <img
              src={appIcon}
              alt="Logo"
              className="h-12 w-12 object-contain drop-shadow-md"
            />

            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(var(--brand-primary))] text-white shadow-lg border border-[rgb(var(--bg-base))]"
            >
              <Search className="h-4 w-4" />
            </motion.div>
          </div>
        </motion.div>

        {/* 404 Text - Gradient & Large */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <span className="text-8xl font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))] drop-shadow-sm">
            404
          </span>
          <div className="mt-2 text-xs font-bold tracking-[0.4em] uppercase text-[rgb(var(--brand-primary))] opacity-80">
            Error
          </div>
        </motion.div>

        {/* Title & Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--text-primary))] sm:text-4xl">
            {t("errors.notFound", "Página no encontrada")}
          </h1>
          <p className="mt-3 text-lg text-[rgb(var(--text-secondary))] max-w-sm mx-auto leading-relaxed">
            {t(
              "errors.notFoundDesc",
              "Lo sentimos, no pudimos encontrar la página que buscas.",
            )}
          </p>
        </motion.div>

        {/* Helpful Actions Box - Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10 w-full overflow-hidden rounded-2xl border border-[rgb(var(--brand-primary)/0.15)] bg-[rgb(var(--bg-surface)/0.4)] backdrop-blur-md shadow-xl"
        >
          <div className="bg-[rgb(var(--brand-primary)/0.05)] px-4 py-3 border-b border-[rgb(var(--brand-primary)/0.1)]">
            <div className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-secondary))] flex items-center gap-2">
              <Compass className="h-3 w-3" />
              ¿Qué puedes hacer?
            </div>
          </div>

          <div className="p-2">
            <div className="group flex items-start gap-3 rounded-xl p-3 hover:bg-[rgb(var(--bg-surface)/0.8)] transition-colors cursor-default">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))] border border-[rgb(var(--brand-primary)/0.1)]">
                <Search className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm text-[rgb(var(--text-primary))]">
                  Verificar la URL
                </div>
                <div className="text-xs text-[rgb(var(--text-secondary))]">
                  Asegúrate de que la dirección esté escrita correctamente.
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgb(var(--border-base))] to-transparent" />

            <div className="group flex items-start gap-3 rounded-xl p-3 hover:bg-[rgb(var(--bg-surface)/0.8)] transition-colors cursor-default">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))] border border-[rgb(var(--brand-primary)/0.1)]">
                <Home className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm text-[rgb(var(--text-primary))]">
                  Usar la navegación
                </div>
                <div className="text-xs text-[rgb(var(--text-secondary))]">
                  Utiliza el menú principal para encontrar la página.
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgb(var(--border-base))] to-transparent" />

            <div className="group flex items-start gap-3 rounded-xl p-3 hover:bg-[rgb(var(--bg-surface)/0.8)] transition-colors cursor-default">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))] border border-[rgb(var(--brand-primary)/0.1)]">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm text-[rgb(var(--text-primary))]">
                  Obtener ayuda
                </div>
                <div className="text-xs text-[rgb(var(--text-secondary))]">
                  Contacta a soporte si crees que es un error.
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-3 w-full"
        >
          <Button
            size="lg"
            onClick={() => navigate("/")}
            className="flex-1 min-w-[140px] shadow-lg shadow-[rgb(var(--brand-primary)/0.2)]"
          >
            <Home className="mr-2 h-4 w-4" />
            {t("nav.home", "Ir al Inicio")}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate(-1)}
            className="flex-1 min-w-[140px]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back", "Volver atrás")}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="flex-1 min-w-[100px]"
            onClick={() => {}} // Placeholder
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Ayuda
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
