import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../../shared/ui/cn";

/**
 * Auth-specific input with built-in icon support and password visibility toggle
 * @param {Object} props
 * @param {React.ElementType} [props.icon] - Icon component to show on the left
 * @param {string} [props.label] - Input label
 * @param {string} [props.error] - Error message
 * @param {string} [props.hint] - Hint text below input
 * @param {string} props.type - Input type
 * @param {string} [props.className] - Additional classes
 */
export function AuthInput({
  icon: Icon,
  label,
  error,
  hint,
  type = "text",
  className,
  ...props
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[rgb(var(--text-primary))]">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
        )}

        <input
          type={inputType}
          className={cn(
            "w-full rounded-[var(--radius)] border bg-[rgb(var(--bg-surface))] py-3 text-sm transition-all",
            "placeholder:text-[rgb(var(--text-muted))]",
            "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary)/0.3)]",
            Icon ? "pl-10" : "pl-4",
            isPassword ? "pr-11" : "pr-4",
            error
              ? "border-[rgb(var(--error))] focus:ring-[rgb(var(--error)/0.3)]"
              : "border-[rgb(var(--border-base))] hover:border-[rgb(var(--border-hover))]",
            className,
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[rgb(var(--text-muted))] transition hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-secondary))]"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-[rgb(var(--error))]">{error}</p>
      )}

      {hint && !error && (
        <p className="text-xs text-[rgb(var(--text-muted))]">{hint}</p>
      )}
    </div>
  );
}
