import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "./cn";

const languages = [
  { code: "es", name: "Español", region: "MX" },
  { code: "en", name: "English", region: "US" },
];

/**
 * Language selector dropdown
 */
export function LanguageSelector({
  className,
  side = "top",
  align = "end",
  iconOnly = false,
}) {
  const { i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  const currentLang =
    languages.find((l) => l.code === i18n.language) || languages[0];

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

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  const sideOffset = side === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const alignClass = align === "end" ? "right-0" : "left-0";

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition w-full",
          "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))]",
          open && "bg-[rgb(var(--bg-muted))]",
        )}
        title="Cambiar idioma"
      >
        <Globe className="h-4 w-4 shrink-0" />
        {!iconOnly && <span className="shrink-0">{currentLang.region}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: side === "top" ? 5 : -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: side === "top" ? 5 : -5 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 min-w-[160px] rounded-xl border border-[rgb(var(--border-base)/0.5)] bg-[rgb(var(--bg-surface))] p-1.5 shadow-xl",
              sideOffset,
              alignClass,
            )}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition mx-1 my-0.5 max-w-[calc(100%-8px)]",
                  lang.code === i18n.language
                    ? "bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))]"
                    : "text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-muted))]",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "text-xs font-bold uppercase",
                      lang.code === i18n.language
                        ? "text-[rgb(var(--brand-primary))]"
                        : "text-[rgb(var(--text-secondary))]",
                    )}
                  >
                    {lang.region}
                  </span>
                  <span className="font-medium">{lang.name}</span>
                </div>
                {lang.code === i18n.language && <Check className="h-4 w-4" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
