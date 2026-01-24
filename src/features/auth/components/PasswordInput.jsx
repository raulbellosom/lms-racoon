import React from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../shared/ui/cn";

/**
 * Password input with visibility toggle, real-time validation, and strength indicator
 */
export function PasswordInput({
  value,
  onChange,
  label,
  placeholder = "••••••••",
  error,
  showStrength = false,
  confirmValue,
  isConfirm = false,
  autoComplete = "new-password",
  className,
  ...props
}) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);

  // Password strength calculation
  const getStrength = (pwd) => {
    if (!pwd) return { level: 0, label: "", color: "" };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 1) {
      return {
        level: 1,
        label: t("auth.passwordStrength.weak", "Débil"),
        color: "bg-red-500",
      };
    }
    if (score <= 2) {
      return {
        level: 2,
        label: t("auth.passwordStrength.fair", "Regular"),
        color: "bg-orange-500",
      };
    }
    if (score <= 3) {
      return {
        level: 3,
        label: t("auth.passwordStrength.good", "Buena"),
        color: "bg-yellow-500",
      };
    }
    if (score <= 4) {
      return {
        level: 4,
        label: t("auth.passwordStrength.strong", "Fuerte"),
        color: "bg-green-500",
      };
    }
    return {
      level: 5,
      label: t("auth.passwordStrength.veryStrong", "Muy fuerte"),
      color: "bg-emerald-500",
    };
  };

  const strength = showStrength ? getStrength(value) : null;

  // For confirm password: check if matches
  const passwordsMatch =
    isConfirm && confirmValue !== undefined
      ? value === confirmValue && value.length > 0
      : null;

  const passwordsDontMatch =
    isConfirm && confirmValue !== undefined && value.length > 0
      ? value !== confirmValue
      : false;

  // Determine border color
  const getBorderClass = () => {
    if (error) return "border-red-500 focus:ring-red-500";
    if (passwordsMatch === true) return "border-green-500 focus:ring-green-500";
    if (passwordsDontMatch) return "border-red-500 focus:ring-red-500";
    return "border-[rgb(var(--border-base))] focus:ring-[rgb(var(--brand-primary))]";
  };

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            "w-full rounded-xl border bg-[rgb(var(--bg-surface))] px-4 py-3 pr-12 text-sm transition-all",
            "focus:outline-none focus:ring-2",
            getBorderClass(),
          )}
          {...props}
        />

        {/* Toggle visibility button */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Strength indicator */}
      {showStrength && value && strength && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  level <= strength.level
                    ? strength.color
                    : "bg-[rgb(var(--bg-muted))]",
                )}
              />
            ))}
          </div>
          <p className={cn("text-xs", strength.color.replace("bg-", "text-"))}>
            {strength.label}
          </p>
        </div>
      )}

      {/* Match indicator for confirm password */}
      {isConfirm && value && (
        <div className="flex items-center gap-1">
          {passwordsMatch ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-500">
                {t("auth.passwordsMatch", "Las contraseñas coinciden")}
              </span>
            </>
          ) : (
            <>
              <X className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-500">
                {t("auth.passwordsDontMatch", "Las contraseñas no coinciden")}
              </span>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {error && !isConfirm && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
