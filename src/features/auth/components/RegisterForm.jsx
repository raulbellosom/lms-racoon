import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, User2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import { Button } from "../../../shared/ui/Button";
import { AuthInput } from "./AuthInput";
import { PasswordInput } from "./PasswordInput";
import { register } from "../../../shared/services/auth";
import { authStore } from "../../../app/stores/authStore";
import { useToast } from "../../../app/providers/ToastProvider";

/**
 * Registration form component with validation and animations
 */
export function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errors, setErrors] = React.useState({});
  const [busy, setBusy] = React.useState(false);

  // Real-time validation
  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case "firstName":
        if (!value.trim()) {
          newErrors.firstName = t("auth.errors.required");
        } else {
          delete newErrors.firstName;
        }
        break;
      case "email":
        if (!value) {
          newErrors.email = t("auth.errors.required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = t("auth.errors.invalidEmail");
        } else {
          delete newErrors.email;
        }
        break;
      case "password":
        if (!value) {
          newErrors.password = t("auth.errors.required");
        } else if (value.length < 8) {
          newErrors.password = t("auth.errors.passwordMin");
        } else {
          delete newErrors.password;
        }
        // Re-validate confirm if password changes
        if (confirmPassword && value !== confirmPassword) {
          newErrors.confirmPassword = t("auth.errors.passwordMatch");
        } else if (confirmPassword && value === confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;
      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword = t("auth.errors.required");
        } else if (value !== password) {
          newErrors.confirmPassword = t("auth.errors.passwordMatch");
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }

    setErrors(newErrors);
  };

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

    if (!confirmPassword) {
      newErrors.confirmPassword = t("auth.errors.required");
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = t("auth.errors.passwordMatch");
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

      // Check for returnUrl
      const returnUrl = location.state?.returnUrl || "/app/home";
      navigate(returnUrl);
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

  const passwordsMatch =
    password && confirmPassword && password === confirmPassword;
  const isFormValid =
    firstName.trim() && email && password.length >= 8 && passwordsMatch;

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
          onChange={(e) => {
            setFirstName(e.target.value);
            validateField("firstName", e.target.value);
          }}
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
        onChange={(e) => {
          setEmail(e.target.value);
          validateField("email", e.target.value);
        }}
        error={errors.email}
        placeholder="tu@email.com"
        autoComplete="email"
      />

      <PasswordInput
        label={t("auth.password")}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          validateField("password", e.target.value);
        }}
        error={errors.password}
        showStrength={true}
        autoComplete="new-password"
      />

      <PasswordInput
        label={t("auth.confirmPassword")}
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          validateField("confirmPassword", e.target.value);
        }}
        isConfirm={true}
        confirmValue={password}
        autoComplete="new-password"
      />

      <Button
        type="submit"
        className="w-full btn-shimmer"
        disabled={busy || !isFormValid}
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
