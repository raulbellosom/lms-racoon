import React from "react";
import { useModeAnimation } from "react-theme-switch-animation";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "../ui/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

/**
 * Dropdown-style theme selector, similar to LanguageSelector.
 */
export function ThemeSelect({
  className,
  side = "top",
  align = "end",
  iconOnly = false,
}) {
  const { theme, setTheme, resolved } = useTheme();
  const { t } = useTranslation();
  // Store the target theme during animation
  const pendingThemeRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Hook for animation
  const { ref, toggleSwitchTheme } = useModeAnimation({
    duration: 520,
    isDarkMode: resolved === "dark",
    onDarkModeChange: () => {
      if (pendingThemeRef.current) {
        setTheme(pendingThemeRef.current);
        pendingThemeRef.current = null;
      }
    },
  });

  const handleThemeChange = (newTheme, event) => {
    // If selecting the same theme, just close
    if (theme === newTheme) {
      setOpen(false);
      return;
    }

    const getSystemTheme = () =>
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
        ? "dark"
        : "light";
    const nextResolved = newTheme === "system" ? getSystemTheme() : newTheme;
    const isVisualChange = nextResolved !== resolved;

    if (isVisualChange) {
      pendingThemeRef.current = newTheme;
      toggleSwitchTheme(event);
    } else {
      setTheme(newTheme);
    }
    setOpen(false);
  };

  const options = [
    { value: "light", icon: Sun, label: t("common.themes.light") },
    { value: "dark", icon: Moon, label: t("common.themes.dark") },
    { value: "system", icon: Monitor, label: t("common.themes.system") },
  ];

  const currentOption = options.find((o) => o.value === theme) || options[0];
  const CurrentIcon = currentOption.icon;

  const sideOffset = side === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const alignClass = align === "end" ? "right-0" : "left-0";

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        ref={ref}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition w-full",
          "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))]",
          open && "bg-[rgb(var(--bg-muted))]",
        )}
        title={t("common.theme")}
      >
        <CurrentIcon className="h-4 w-4 shrink-0" />
        {!iconOnly && <span className="shrink-0">{currentOption.label}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: side === "top" ? 5 : -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: side === "top" ? 5 : -5 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 min-w-[140px] rounded-xl border border-[rgb(var(--border-base)/0.5)] bg-[rgb(var(--bg-surface))] p-1.5 shadow-xl",
              sideOffset,
              alignClass,
            )}
          >
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={(e) => handleThemeChange(opt.value, e)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition mx-1 my-0.5 max-w-[calc(100%-8px)]",
                    opt.value === theme
                      ? "bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))]"
                      : "text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-muted))]",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{opt.label}</span>
                  </div>
                  {opt.value === theme && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
