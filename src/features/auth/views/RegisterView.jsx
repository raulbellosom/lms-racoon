import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import { AuthCard, AuthFooter } from "../components/AuthCard";
import { RegisterForm } from "../components/RegisterForm";

/**
 * Register view - Premium auth page with animated card
 */
export function RegisterView() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center px-4 py-12">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top right gradient */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-primary)/0.15),transparent_60%)] blur-3xl" />
        {/* Bottom left gradient */}
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-secondary)/0.1),transparent_60%)] blur-3xl" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute left-1/2 top-8 -translate-x-1/2"
      >
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))]">
            <span className="text-lg font-black text-white">R</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            Racoon LMS
          </span>
        </a>
      </motion.div>

      {/* Auth card */}
      <AuthCard
        title={t("auth.registerTitle")}
        subtitle={t("auth.registerSubtitle")}
      >
        <RegisterForm />
        <AuthFooter
          text={t("auth.hasAccount")}
          linkText={t("auth.loginButton")}
          linkTo="/auth/login"
        />
      </AuthCard>
    </div>
  );
}
