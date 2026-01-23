import { motion } from "framer-motion";
import { cn } from "../../../shared/ui/cn";

/**
 * Premium auth card with glassmorphism and glow effects
 * @param {Object} props
 * @param {string} [props.title] - Card title
 * @param {string} [props.subtitle] - Card subtitle/description
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className] - Additional classes
 */
export function AuthCard({ title, subtitle, children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-6 shadow-xl sm:p-8",
        className,
      )}
    >
      {/* Top glow effect */}
      <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-primary)/0.2),transparent_70%)] blur-2xl" />

      {/* Content */}
      <div className="relative">
        {(title || subtitle) && (
          <div className="mb-6 text-center">
            {title && (
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}

/**
 * Divider with "or" text for social login separation
 */
export function AuthDivider({ text = "o continúa con" }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[rgb(var(--border-base))]" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-[rgb(var(--bg-surface))] px-3 text-[rgb(var(--text-muted))]">
          {text}
        </span>
      </div>
    </div>
  );
}

/**
 * Auth footer link (e.g., "Don't have an account? Sign up")
 */
export function AuthFooter({ text, linkText, linkTo }) {
  return (
    <p className="mt-6 text-center text-sm text-[rgb(var(--text-secondary))]">
      {text}{" "}
      <a
        href={linkTo}
        className="font-semibold text-[rgb(var(--brand-primary))] transition hover:text-[rgb(var(--brand-secondary))]"
      >
        {linkText}
      </a>
    </p>
  );
}
