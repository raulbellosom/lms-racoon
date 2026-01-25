import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import { Button } from "../../../shared/ui/Button";
import { AuthInput } from "./AuthInput";
import { login } from "../../../shared/services/auth";
import { authStore } from "../../../app/stores/authStore";
import { useToast } from "../../../app/providers/ToastProvider";

/**
 * Login form component with validation and animations
 */
export function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [busy, setBusy] = React.useState(false);

  const validate = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = t("auth.errors.required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t("auth.errors.invalidEmail");
    }

    if (!password) {
      newErrors.password = t("auth.errors.required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setBusy(true);
    try {
      const { user, profile } = await login({ email, password });
      authStore.setState({ session: { ok: true }, user, profile });
      toast.push({
        title: t("toast.successTitle"),
        message: t("auth.welcomeBack"),
        variant: "success",
      });

      // Check for returnUrl
      // Check for returnUrl
      const searchParams = new URLSearchParams(window.location.search);
      let returnUrl =
        searchParams.get("redirect") ||
        location.state?.returnUrl ||
        "/app/home";

      // Ensure returnUrl is absolute path relative to root if it starts with /
      if (!returnUrl.startsWith("/")) {
        returnUrl = "/" + returnUrl;
      }

      console.log("Redirecting to:", returnUrl); // Debug

      // If returning to public cart alias, switch to app cart
      if (returnUrl === "/cart") {
        returnUrl = "/app/cart";
      }

      navigate(returnUrl, { replace: true });
    } catch (err) {
      toast.push({
        title: t("toast.errorTitle"),
        message: err?.message || t("auth.errors.loginFailed"),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <AuthInput
        icon={Mail}
        label={t("auth.email")}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        placeholder="tu@email.com"
        autoComplete="email"
      />

      <AuthInput
        icon={KeyRound}
        label={t("auth.password")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        placeholder="••••••••"
        autoComplete="current-password"
      />

      {/* Forgot password link */}
      <div className="flex justify-end">
        <Link
          to="/forgot-password"
          className="text-xs font-medium text-[rgb(var(--brand-primary))] transition hover:text-[rgb(var(--brand-secondary))]"
        >
          {t("auth.forgotPassword")}
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full btn-shimmer"
        disabled={busy}
        size="lg"
      >
        {busy ? t("common.loading") : t("auth.loginButton")}
      </Button>
    </motion.form>
  );
}
