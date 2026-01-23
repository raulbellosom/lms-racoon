import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { LayoutGrid, LogIn, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../shared/ui/Button";
import {
  useTheme,
  ThemeToggleButton,
} from "../../../shared/theme/ThemeProvider";
import { Drawer, DrawerSection } from "../../../shared/ui/Drawer";

export function PublicLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const { scrollY } = useScroll();
  const headerBg = useTransform(
    scrollY,
    [0, 50],
    ["rgba(var(--bg-surface) / 0)", "rgba(var(--bg-surface) / 0.9)"],
  );

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-dvh">
      {/* ========== Header ========== */}
      <motion.header
        style={{ backgroundColor: headerBg }}
        className="fixed left-0 right-0 top-0 z-40 border-b border-[rgb(var(--border-base))/0.5] backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))]">
              <span className="text-lg font-black text-white">R</span>
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-extrabold tracking-tight">
                Racoon LMS
              </div>
              <div className="text-xs text-[rgb(var(--text-secondary))]">
                {t("landing.features.tasksQaReviews")}
              </div>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-2 md:flex">
            <NavLink
              to="/catalog"
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-primary))]"
                    : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))]",
                ].join(" ")
              }
            >
              <LayoutGrid className="h-4 w-4" /> {t("nav.catalog")}
            </NavLink>

            <div className="mx-2 h-5 w-px bg-[rgb(var(--border-base))]" />

            <ThemeToggleButton className="rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]" />

            <NavLink to="/auth/login">
              <Button variant="secondary" size="sm">
                <LogIn className="h-4 w-4" /> {t("common.login")}
              </Button>
            </NavLink>

            <NavLink to="/auth/register">
              <Button size="sm" className="btn-shimmer">
                {t("auth.createAccount")}
              </Button>
            </NavLink>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggleButton className="rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]" />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-[rgb(var(--text-secondary))] transition hover:bg-[rgb(var(--bg-muted))]"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <Drawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        side="right"
        title="Menú"
      >
        <DrawerSection>
          <div className="space-y-2">
            <NavLink
              to="/catalog"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[rgb(var(--bg-muted))]"
            >
              <LayoutGrid className="h-5 w-5" /> {t("nav.catalog")}
            </NavLink>
          </div>
        </DrawerSection>

        <DrawerSection>
          <div className="space-y-2">
            <NavLink to="/auth/login" className="block">
              <Button variant="secondary" className="w-full">
                <LogIn className="h-4 w-4" /> {t("common.login")}
              </Button>
            </NavLink>
            <NavLink to="/auth/register" className="block">
              <Button className="w-full">{t("auth.createAccount")}</Button>
            </NavLink>
          </div>
        </DrawerSection>
      </Drawer>

      {/* ========== Main Content ========== */}
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ========== Footer ========== */}
      <footer className="mt-16 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))]">
                <span className="text-sm font-bold text-white">R</span>
              </div>
              <span className="font-bold">Racoon LMS</span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-[rgb(var(--text-secondary))]">
              <NavLink
                to="/catalog"
                className="transition hover:text-[rgb(var(--text-primary))]"
              >
                {t("nav.catalog")}
              </NavLink>
              <a
                href="#"
                className="transition hover:text-[rgb(var(--text-primary))]"
              >
                {t("auth.terms")}
              </a>
              <a
                href="#"
                className="transition hover:text-[rgb(var(--text-primary))]"
              >
                {t("auth.privacy")}
              </a>
            </div>

            {/* Copyright */}
            <div className="text-sm text-[rgb(var(--text-muted))]">
              © {new Date().getFullYear()} Racoon Devs
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
