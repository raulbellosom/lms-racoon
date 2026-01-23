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
/**
 * Componente de selección de tema con 3 estados: Claro, Oscuro, Sistema.
 * - Iconos minimalistas (Lucide).
 * - Animación de reveal al cambiar (react-theme-switch-animation).
 * - Diseño tipo "pill" segmentado.
 */
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeSelector({ className = "" }) {
  const { theme, setTheme, resolved } = useTheme();
  // Store the target theme during animation
  const pendingThemeRef = React.useRef(null);

  const { ref, toggleSwitchTheme } = useModeAnimation({
    duration: 520,
    isDarkMode: resolved === "dark",
    onDarkModeChange: () => {
      // Apply the theme change only when the animation mask is active
      if (pendingThemeRef.current) {
        setTheme(pendingThemeRef.current);
        pendingThemeRef.current = null;
      }
    },
  });

  const handleThemeChange = (newTheme, event) => {
    if (theme === newTheme) return;

    const nextResolved = newTheme === "system" ? getSystemTheme() : newTheme;
    const isVisualChange = nextResolved !== resolved;

    if (isVisualChange) {
      // If visual change needed, set pending ref and trigger animation
      pendingThemeRef.current = newTheme;
      toggleSwitchTheme(event);
    } else {
      // If no visual change (e.g. system matches current), update state immediately
      // to update the selected button UI without flashing screen
      setTheme(newTheme);
    }
  };

  const options = [
    { value: "light", icon: Sun, label: "Claro" },
    { value: "dark", icon: Moon, label: "Oscuro" },
    { value: "system", icon: Monitor, label: "Sistema" },
  ];

  return (
    <div
      ref={ref}
      className={[
        "flex items-center gap-2 rounded-full bg-[rgb(var(--bg-muted))] p-1.5 border border-[rgb(var(--border-base))]",
        className,
      ].join(" ")}
    >
      {options.map((opt) => {
        const isActive = theme === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            onClick={(e) => handleThemeChange(opt.value, e)}
            className={[
              "relative z-10 flex flex-1 items-center justify-center rounded-full py-2 px-3 transition-all duration-300",
              isActive
                ? "bg-[rgb(var(--bg-surface))] text-[rgb(var(--brand-primary))] shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                : "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]",
            ].join(" ")}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4 stroke-[2.5]" />
          </button>
        );
      })}
    </div>
  );
}

// Deprecated alias
/**
 * Botón simple de toggle (2 estados: Claro <-> Oscuro).
 * Ideal para el Navbar donde el espacio es reducido.
 */
export function ThemeToggleButton({ className = "" }) {
  const { resolved, setTheme } = useTheme();
  const pendingThemeRef = React.useRef(null);

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

  const toggle = (event) => {
    const next = resolved === "dark" ? "light" : "dark";
    pendingThemeRef.current = next;
    toggleSwitchTheme(event);
  };

  return (
    <button
      ref={ref}
      onClick={toggle}
      className={[
        "flex items-center justify-center rounded-xl p-2 text-[rgb(var(--text-secondary))] transition hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))]",
        className,
      ].join(" ")}
      aria-label="Alternar tema"
    >
      {resolved === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
