import React from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Home,
  LineChart,
  LogOut,
  Settings,
  SquarePen,
  Menu,
  X,
  Monitor,
  User,
  Users,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../shared/ui/Button";
import { Drawer, DrawerSection } from "../../../shared/ui/Drawer";
import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from "../../../shared/ui/Dropdown";
import { Avatar } from "../../../shared/ui/Avatar";
import { useAuth } from "../../providers/AuthProvider";
import { logout } from "../../../shared/services/auth";
import { useTheme, ThemeSelector } from "../../../shared/theme/ThemeProvider";
import { ProfileService } from "../../../shared/data/profiles";

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
          isActive
            ? "bg-[rgb(var(--brand-primary))] text-white shadow-md"
            : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))]",
        ].join(" ")
      }
    >
      <Icon className="h-5 w-5" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function MobileNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all",
          isActive
            ? "text-[rgb(var(--brand-primary))]"
            : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <motion.div
            initial={false}
            animate={{
              scale: isActive ? 1.1 : 1,
              y: isActive ? -2 : 0,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
          <span>{label}</span>
          {isActive && (
            <motion.div
              layoutId="mobile-nav-indicator"
              className="absolute -bottom-1 h-1 w-8 rounded-full bg-[rgb(var(--brand-primary))]"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

export function AppLayout() {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const role = auth.profile?.role || "student";
  const displayName =
    (auth.profile?.firstName && auth.profile?.lastName
      ? `${auth.profile.firstName} ${auth.profile.lastName}`
      : auth.profile?.firstName) ||
    auth.user?.name ||
    t("student.welcome");

  const onLogout = async () => {
    await logout().catch(() => {});
    navigate("/");
  };

  // Close drawer on route change
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: "/app/home", icon: Home, label: t("nav.home") },
    { to: "/app/my-courses", icon: BookOpen, label: t("nav.myCourses") },
    { to: "/app/progress", icon: LineChart, label: t("nav.progress") },
    ...(role !== "student"
      ? [{ to: "/app/teach", icon: SquarePen, label: t("nav.teacherPanel") }]
      : []),
    ...(role === "admin"
      ? [{ to: "/app/admin/users", icon: Users, label: "Usuarios" }]
      : []),
  ];

  return (
    <div className="min-h-dvh bg-[rgb(var(--bg-base))]">
      {/* ========== Desktop Sidebar ========== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-[rgb(var(--border-base))] px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))]">
            <span className="text-lg font-black text-white">R</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            Racoon LMS
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Theme & User actions */}
        <div className="border-t border-[rgb(var(--border-base))] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">
              {t("common.theme")}
            </span>
            <ThemeSelector />
          </div>

          <Dropdown
            align="left"
            side="top"
            className="w-56"
            trigger={
              <div className="flex w-full items-center gap-3 rounded-xl bg-[rgb(var(--bg-muted))] p-2 transition hover:bg-[rgb(var(--bg-muted))/0.8]">
                <Avatar
                  name={displayName}
                  src={ProfileService.getAvatarUrl(auth.profile?.avatarFileId)}
                  size="sm"
                  ring
                />
                <div className="flex-1 overflow-hidden text-left">
                  <div className="truncate text-sm font-bold text-[rgb(var(--text-primary))]">
                    {displayName}
                  </div>
                  <div className="truncate text-xs text-[rgb(var(--text-secondary))]">
                    {auth.user?.email}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-[rgb(var(--text-muted))]" />
              </div>
            }
          >
            <div className="px-3 py-2">
              <div className="text-xs font-bold text-[rgb(var(--text-primary))]">
                {displayName}
              </div>
              <div className="text-xs text-[rgb(var(--text-secondary))]">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </div>
            </div>
            <DropdownDivider />
            <DropdownItem icon={User} onClick={() => navigate("/app/profile")}>
              {t("nav.profile", "Mi Perfil")}
            </DropdownItem>
            <DropdownItem
              icon={Settings}
              onClick={() => navigate("/app/settings")}
            >
              {t("common.settings")}
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={LogOut} onClick={onLogout} danger>
              {t("common.logout")}
            </DropdownItem>
          </Dropdown>
        </div>
      </aside>

      {/* ========== Desktop Main ========== */}
      <main className="hidden min-h-dvh md:block md:pl-72">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ========== Mobile Header ========== */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))/0.9] px-4 backdrop-blur-lg md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg p-2 text-[rgb(var(--text-secondary))] transition hover:bg-[rgb(var(--bg-muted))]"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-accent))]">
            <span className="text-xs font-bold text-white">R</span>
          </div>
          <span className="font-bold">Racoon LMS</span>
        </div>
        <div className="w-9" /> {/* Spacer for centering */}
      </header>

      {/* ========== Mobile Drawer ========== */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side="left"
        title="Menú"
      >
        {/* User info */}
        <DrawerSection>
          <div className="rounded-xl bg-[rgb(var(--bg-muted))] p-4">
            <div className="text-sm font-bold">{displayName}</div>
            <div className="mt-0.5 text-xs text-[rgb(var(--text-secondary))]">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </div>
          </div>
        </DrawerSection>

        {/* Navigation */}
        <DrawerSection title={t("nav.explore")}>
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                onClick={() => setDrawerOpen(false)}
              />
            ))}
          </div>
        </DrawerSection>

        {/* Theme */}
        <DrawerSection title={t("common.theme")}>
          <div className="flex justify-end">
            <ThemeSelector className="w-full" />
          </div>
        </DrawerSection>

        {/* Actions */}
        <DrawerSection>
          <div className="space-y-2">
            <Button variant="secondary" className="w-full" size="sm">
              <Settings className="h-4 w-4" /> {t("common.settings")}
            </Button>
            <Button
              variant="secondary"
              onClick={onLogout}
              className="w-full"
              size="sm"
            >
              <LogOut className="h-4 w-4" /> {t("common.logout")}
            </Button>
          </div>
        </DrawerSection>
      </Drawer>

      {/* ========== Mobile Main ========== */}
      <main className="min-h-dvh pt-14 pb-20 md:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ========== Mobile Bottom Nav ========== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))/0.95] backdrop-blur-lg md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {navItems.slice(0, 4).map((item) => (
            <div key={item.to} className="relative flex-1">
              <MobileNavItem {...item} />
            </div>
          ))}
          <div className="relative flex-1">
            <button
              onClick={onLogout}
              className="flex w-full flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-[rgb(var(--text-muted))] transition-all hover:text-[rgb(var(--text-primary))]"
            >
              <LogOut className="h-5 w-5" />
              <span>{t("common.logout")}</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
