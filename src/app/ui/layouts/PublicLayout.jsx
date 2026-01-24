import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { LayoutGrid, LogIn, Menu, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../shared/ui/Button";
import { ThemeToggleButton } from "../../../shared/theme/ThemeProvider";
import { Drawer, DrawerSection } from "../../../shared/ui/Drawer";
import { LanguageSelector } from "../../../shared/ui/LanguageSelector";
import { PublicNavbar } from "../../../features/public/components/Landing/PublicNavbar";
import appIcon from "../../../resources/icon.svg";

export function PublicLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="min-h-dvh">
      {/* ========== Header ========== */}
      {/* ========== Header ========== */}
      <PublicNavbar />

      {/* Mobile Drawer */}

      {/* ========== Main Content ========== */}
      <main className="pt-2">
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
      <footer className="mt-16 border-t border-[rgb(var(--border-base)/0.5)] bg-[rgb(var(--bg-surface))]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center">
                <img
                  src={appIcon}
                  alt="Racoon LMS"
                  className="h-full w-full object-contain"
                />
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
