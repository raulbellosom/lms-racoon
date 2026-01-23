import React from "react";
import { useModeAnimation } from "react-theme-switch-animation";

const ThemeContext = React.createContext(null);

function getSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}) {
  const [theme, setTheme] = React.useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved || defaultTheme;
  });

  const resolved = theme === "system" ? getSystemTheme() : theme;

  React.useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  React.useEffect(() => {
    if (theme !== "system") localStorage.setItem(storageKey, theme);
    else localStorage.removeItem(storageKey);
  }, [theme, storageKey]);

  React.useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(getSystemTheme());
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [theme]);

  const toggle = React.useCallback(() => {
    const next = resolved === "dark" ? "light" : "dark";
    setTheme(next);
  }, [resolved]);

  const value = React.useMemo(
    () => ({ theme, resolved, setTheme, toggle }),
    [theme, resolved, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/**
 * Drop-in theme toggle button with animated transition.
 * (Uses react-theme-switch-animation under the hood)
 */
export function ThemeToggleButton({ className = "" }) {
  const { resolved, toggle: themeToggle } = useTheme();
  const { ref, toggleSwitchTheme } = useModeAnimation({
    duration: 520,
    isDarkMode: resolved === "dark",
    onDarkModeChange: (isDark) => {
      // Sync with our theme system
      if (isDark !== (resolved === "dark")) {
        themeToggle();
      }
    },
  });

  return (
    <button
      ref={ref}
      className={[
        "flex items-center justify-center rounded-xl px-3 py-2 text-lg transition",
        "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))]",
        className,
      ].join(" ")}
      onClick={toggleSwitchTheme}
      aria-label="Cambiar tema"
      title={
        resolved === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
      }
    >
      {resolved === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
