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
  School,
  Menu,
  X,
  Monitor,
  User,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import appIcon from "../../../resources/icon.svg";

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
import {
  useTheme,
  ThemeSelector,
  ThemeToggleButton,
} from "../../../shared/theme/ThemeProvider";
import { ThemeSelect } from "../../../shared/theme/ThemeSelect";
import { LanguageSelector } from "../../../shared/ui/LanguageSelector";
import { ProfileService } from "../../../shared/data/profiles";

/**
 * NavItem with precise fixed-width icon aligned.
 * Structure: [Fixed 5rem Icon Area] [Animated Text Area]
 */
function NavItem({ to, icon: Icon, label, onClick, collapsed }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "group flex items-center overflow-hidden transition-all relative select-none mx-2 my-0.5 rounded-xl",
          isActive
            ? "bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))] font-semibold"
            : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))] hover:text-[rgb(var(--text-primary))]",
        ].join(" ")
      }
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          {/* Icon Area - ALWAYS w-16 (4rem) to be compact but clickable. 
              Reducing width slightly from w-20 to match standard sizing better if we add margins.
              Let's keep w-12 for the icon container itself.
          */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center">
            {/* The icon itself doesn't need a background anymore since the parent has it. */}
            <Icon
              className={`h-5 w-5 ${
                isActive ? "text-[rgb(var(--brand-primary))]" : ""
              }`}
            />
          </div>

          {/* Text - Smooth reveal */}
          <div
            className={`grid transition-[grid-template-columns] duration-300 ease-in-out ${
              collapsed ? "grid-cols-[0fr]" : "grid-cols-[1fr]"
            }`}
          >
            <span
              className={`overflow-hidden whitespace-nowrap text-sm font-semibold transition-opacity duration-300 pr-3 ${
                isActive ? "text-[rgb(var(--brand-primary))]" : ""
              }`}
            >
              {label}
            </span>
          </div>
        </>
      )}
    </NavLink>
  );
}

function MobileNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-semibold transition-all",
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
          <span className="truncate max-w-[60px]">{label}</span>
          {isActive && (
            <motion.div
              layoutId="mobile-nav-indicator"
              className="absolute -bottom-1 h-0.5 w-6 rounded-full bg-[rgb(var(--brand-primary))]"
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
  const { auth, authStore } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Sidebar state
  const [collapsed, setCollapsed] = React.useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const role = auth.profile?.role || "student";
  const displayName =
    (auth.profile?.firstName && auth.profile?.lastName
      ? `${auth.profile.firstName} ${auth.profile.lastName}`
      : auth.profile?.firstName) ||
    auth.user?.name ||
    t("student.welcome");

  const onLogout = async () => {
    // Always clear local state to ensure UI updates even if server session is gone (401)
    await logout().catch(() => {});
    authStore.clear();
    navigate("/");
  };

  // Close drawer on route change
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: "/app/home", icon: Home, label: t("nav.home") },
    { to: "/app/explore", icon: Search, label: t("nav.explore") },
    { to: "/app/my-courses", icon: BookOpen, label: t("nav.myCourses") },
    { to: "/app/progress", icon: LineChart, label: t("nav.progress") },
    ...(role !== "student"
      ? [{ to: "/app/teach", icon: School, label: t("nav.teacherPanel") }]
      : []),
    ...(role === "admin"
      ? [
          {
            to: "/app/admin/users",
            icon: Users,
            label: t("nav.users", "Usuarios"),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-dvh bg-[rgb(var(--bg-base))]">
      {/* ========== Desktop Sidebar ========== */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] transition-all duration-300 ease-in-out md:flex ${
          collapsed ? "w-16" : "w-72"
        }`}
      >
        {/* Logo Area */}
        <div className="flex h-16 items-center overflow-hidden border-b border-[rgb(var(--border-base))] mx-2">
          <div className="flex h-full w-12 shrink-0 items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center">
              <img
                src={appIcon}
                alt="Racoon LMS"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div
            className={`grid transition-[grid-template-columns] duration-300 ease-in-out ${
              collapsed ? "grid-cols-[0fr]" : "grid-cols-[1fr]"
            }`}
          >
            <span className="overflow-hidden whitespace-nowrap text-lg font-extrabold tracking-tight text-[rgb(var(--text-primary))]">
              Racoon LMS
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-x-hidden overflow-y-auto pt-6 scrollbar-thin">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Footer Area */}
        <div className="border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))/0.3]">
          {/* Theme Toggle Area */}
          <div className="py-4">
            {collapsed ? (
              <div className="flex flex-col gap-3 items-center px-1">
                <LanguageSelector
                  className="w-full justify-center"
                  iconOnly
                  side="top"
                  align="start"
                />
                <ThemeSelect
                  className="w-full justify-center"
                  iconOnly
                  side="top"
                  align="start"
                />
              </div>
            ) : (
              <div className="px-4 fade-in duration-300">
                <div className="flex items-center justify-between gap-2">
                  <LanguageSelector
                    className="flex-1"
                    side="top"
                    align="start"
                  />
                  <div className="h-6 w-px bg-[rgb(var(--border-base))]" />
                  <ThemeSelect className="flex-1" side="top" align="end" />
                </div>
              </div>
            )}
          </div>

          {/* Collapse Toggle - Floating or Fixed? 
               User requested a toggle. A centered button at the bottom of the column is good.
           */}
          <div
            className="flex h-12 items-center justify-center border-t border-[rgb(var(--border-base))] hover:bg-[rgb(var(--bg-muted))] transition-colors cursor-pointer"
            onClick={toggleSidebar}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
            )}
          </div>
        </div>
      </aside>

      {/* ========== Desktop Top Navbar ========== */}
      <header
        className={`fixed top-0 right-0 z-20 hidden h-16 items-center justify-between border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-6 transition-all duration-300 ease-in-out md:flex ${
          collapsed ? "left-16" : "left-72"
        }`}
      >
        {/* Search Bar */}
        <div className="flex w-96 items-center gap-2 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-base))] px-3 py-2 transition-colors hover:border-[rgb(var(--text-secondary))] focus-within:border-[rgb(var(--brand-primary))] focus-within:ring-1 focus-within:ring-[rgb(var(--brand-primary))]">
          <Search className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
          <input
            type="text"
            placeholder={t("common.searchCourses", "Buscar cursos...")}
            className="flex-1 border-none bg-transparent text-sm placeholder-[rgb(var(--text-secondary))] outline-none focus:outline-none focus:ring-0"
          />
        </div>

        {/* Right Actions: User Profile */}
        <div className="flex items-center gap-4">
          <Dropdown
            align="end"
            side="bottom"
            sideOffset={8}
            className="w-60 min-w-[240px]"
            trigger={
              <button className="group flex items-center gap-3 transition-colors">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-[rgb(var(--text-primary))]">
                    {displayName}
                  </span>
                  <span className="text-xs text-[rgb(var(--text-secondary))]">
                    {auth.user?.email}
                  </span>
                </div>
                <Avatar
                  name={displayName}
                  src={ProfileService.getAvatarUrl(auth.profile?.avatarFileId)}
                  size="md"
                  ring
                  className="transition-transform group-hover:scale-105"
                />
              </button>
            }
          >
            <div className="px-3 py-2">
              <div className="text-xs font-bold text-[rgb(var(--text-primary))]">
                {displayName}
              </div>
              <div className="text-xs text-[rgb(var(--text-secondary))]">
                {t(`roles.${role}`, role)}
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
      </header>

      {/* ========== Desktop Main ========== */}
      <main
        className={`hidden min-h-dvh pt-16 pb-12 transition-all duration-300 ease-in-out md:block ${
          collapsed ? "md:pl-16" : "md:pl-72"
        }`}
      >
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

      {/* ========== Desktop Footer "Powered By" ========== */}
      <div
        className={`fixed bottom-0 right-0 z-20 hidden h-12 items-center justify-end px-4 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-base))] transition-all duration-300 ease-in-out md:flex ${
          collapsed ? "left-16" : "left-72"
        }`}
      >
        <a
          href="https://racoondevs.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-medium text-[rgb(var(--text-secondary))] opacity-60 transition-opacity hover:opacity-100"
        >
          Powered by RacoonDevs
        </a>
      </div>

      {/* ========== Mobile Header ========== */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))/0.9] px-4 pt-safe backdrop-blur-lg md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg p-2 text-[rgb(var(--text-secondary))] transition hover:bg-[rgb(var(--bg-muted))]"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center">
            <img
              src={appIcon}
              alt="Racoon LMS"
              className="h-full w-full object-contain"
            />
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
            <div className="flex items-center gap-3 mb-3">
              <Avatar
                name={displayName}
                src={ProfileService.getAvatarUrl(auth.profile?.avatarFileId)}
                size="md"
                ring
              />
              <div>
                <div className="text-sm font-bold">{displayName}</div>
                <div className="mt-0.5 text-xs text-[rgb(var(--text-secondary))]">
                  {t(`roles.${role}`, role)}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                navigate("/app/profile");
                setDrawerOpen(false);
              }}
            >
              <User className="mr-2 h-4 w-4" /> {t("nav.profile", "Mi Perfil")}
            </Button>
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

        {/* Theme and Language */}
        <DrawerSection title={t("common.settings")}>
          <div className="flex items-center gap-2">
            <LanguageSelector className="flex-1" side="top" align="start" />
            <div className="h-6 w-px bg-[rgb(var(--border-base))]" />
            <ThemeSelect className="flex-1" side="top" align="end" />
          </div>
        </DrawerSection>

        {/* Actions */}
        <DrawerSection>
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full"
              size="sm"
              onClick={() => {
                navigate("/app/settings");
                setDrawerOpen(false);
              }}
            >
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
      <main className="min-h-dvh pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:hidden">
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))/0.95] pb-safe backdrop-blur-lg md:hidden">
        <div className="grid grid-cols-4 items-center px-1 py-1.5">
          {navItems.slice(0, 4).map((item) => (
            <div key={item.to} className="flex justify-center">
              <MobileNavItem {...item} />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}
