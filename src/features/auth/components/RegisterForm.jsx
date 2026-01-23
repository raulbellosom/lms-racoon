import React from "react";
import { useNavigate } from "react-router-dom";
import { Mail, KeyRound, User2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import { Button } from "../../../shared/ui/Button";
import { AuthInput } from "./AuthInput";
import { register } from "../../../shared/services/auth";
import { authStore } from "../../../app/stores/authStore";
import { useToast } from "../../../app/providers/ToastProvider";

/**
 * Registration form component with validation and animations
 */
export function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [busy, setBusy] = React.useState(false);

  const validate = () => {
    const newErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = t("auth.errors.required");
    }

    if (!email) {
      newErrors.email = t("auth.errors.required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t("auth.errors.invalidEmail");
    }

    if (!password) {
      newErrors.password = t("auth.errors.required");
    } else if (password.length < 8) {
      newErrors.password = t("auth.errors.passwordMin");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setBusy(true);
    try {
      const fullName = lastName ? `${firstName} ${lastName}` : firstName;
      const { user, profile } = await register({
        email,
        password,
        name: fullName,
      });
      authStore.setState({ session: { ok: true }, user, profile });
      toast.push({
        title: t("toast.successTitle"),
        message: t("auth.welcomeBack"),
        variant: "success",
      });
      navigate("/app/home");
    } catch (err) {
      toast.push({
        title: t("toast.errorTitle"),
        message: err?.message || t("auth.errors.registerFailed"),
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
      {/* Name fields in grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthInput
          icon={User2}
          label={t("auth.firstName")}
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          error={errors.firstName}
          placeholder="Juan"
          autoComplete="given-name"
        />

        <AuthInput
          label={t("auth.lastName")}
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Pérez"
          autoComplete="family-name"
        />
      </div>

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
        hint={t("auth.errors.passwordMin")}
        placeholder="••••••••"
        autoComplete="new-password"
      />

      <Button
        type="submit"
        className="w-full btn-shimmer"
        disabled={busy}
        size="lg"
      >
        {busy ? t("common.loading") : t("auth.registerButton")}
      </Button>

      {/* Terms and conditions */}
      <p className="text-center text-xs text-[rgb(var(--text-muted))]">
        {t("auth.termsAgree")}{" "}
        <a
          href="#"
          className="text-[rgb(var(--brand-primary))] hover:underline"
        >
          {t("auth.terms")}
        </a>{" "}
        {t("auth.and")}{" "}
        <a
          href="#"
          className="text-[rgb(var(--brand-primary))] hover:underline"
        >
          {t("auth.privacy")}
        </a>
      </p>
    </motion.form>
  );
}
