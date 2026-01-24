import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "../../../../shared/ui/Button";
import { ThemeToggleButton } from "../../../../shared/theme/ThemeProvider";
import { LanguageSelector } from "../../../../shared/ui/LanguageSelector";
import appIcon from "../../../../resources/icon.svg";

export function PublicNavbar() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))/0.8] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center">
              <img
                src={appIcon}
                alt="Racoon LMS"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-lg font-bold tracking-tight text-[rgb(var(--text-primary))]">
              Racoon LMS
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/catalog"
              className="text-sm font-medium text-[rgb(var(--text-secondary))] transition-colors hover:text-[rgb(var(--brand-primary))]"
            >
              {t("nav.explore", "Explorar")}
            </Link>
            <div className="h-4 w-px bg-[rgb(var(--border-base))]" />
            <LanguageSelector side="bottom" />
            <ThemeToggleButton />
            <div className="flex items-center gap-3">
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">
                  {t("auth.login", "Iniciar Sesión")}
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button size="sm">{t("auth.register", "Crear cuenta")}</Button>
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSelector className="min-w-0" side="bottom" />
            <ThemeToggleButton />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 flex flex-col bg-[rgb(var(--bg-surface))] md:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b border-[rgb(var(--border-base))] px-4">
              <Link
                to="/"
                className="flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex h-8 w-8 items-center justify-center">
                  <img
                    src={appIcon}
                    alt="Racoon LMS"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-lg font-bold text-[rgb(var(--text-primary))]">
                  Racoon LMS
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 space-y-6 p-6">
              <div className="flex flex-col gap-4">
                <Link
                  to="/catalog"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-[rgb(var(--text-secondary))]"
                >
                  {t("landing.exploreCourses", "Explorar Cursos")}
                </Link>
              </div>
              <div className="h-px w-full bg-[rgb(var(--border-base))]" />
              <div className="flex flex-col gap-3">
                <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full" size="lg">
                    {t("auth.login", "Iniciar Sesión")}
                  </Button>
                </Link>
                <Link
                  to="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full" size="lg">
                    {t("auth.register", "Crear Cuenta")}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
