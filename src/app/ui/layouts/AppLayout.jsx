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
  ChevronLeft,
  ChevronRight,
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
          "group flex items-center overflow-hidden transition-all relative select-none",
          isActive
            ? "text-[rgb(var(--brand-primary))]"
            : "text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]",
        ].join(" ")
      }
      title={collapsed ? label : undefined}
    >
      {/* Icon Area - ALWAYS w-20 (5rem) and centered.
          The parent 'aside' is w-20 when collapsed.
          So this fills the width exactly. 
          When expanded, it stays w-20 on the left.
      */}
      <div className="flex h-12 w-20 shrink-0 items-center justify-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
            // Active background logic moved to icon container for that "pill" look if desired,
            // or just kept minimal. Let's keep the user's style preference:
            // The previous code put bg on the whole row.
            // If we want the icon to stay fixed but the row has background...
            // If the row has background, the width change of the row might look weird if not careful.
            // Let's stick to: Row has hover effect? Or Icon has hover effect?
            // User images show a "pill" style indicator or icon highlight?
            // Re-reading user images: Image 1 shows simple icons. Image 2 shows "Active" state with purple highlight on the icon itself presumably?
            // Use NavLink isActive boolean to style this inner div.
            ""
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Active Indicator Background (Absolute Positioned for smooth width transition?)
          Actually, simple background on the NavLink works if we handle the text properly.
          But to keep "Icon fixed", the padding must not shift.
          The strictly fixed w-20 div ensures the icon is always at X=2.5rem center.
      */}

      {/* Text - Smooth reveal */}
      <div
        className={`grid transition-[grid-template-columns] duration-300 ease-in-out ${
          collapsed ? "grid-cols-[0fr]" : "grid-cols-[1fr]"
        }`}
      >
        <span className="overflow-hidden whitespace-nowrap text-sm font-semibold transition-opacity duration-300">
          {label}
        </span>
      </div>
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
  const { auth } = useAuth();
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
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] transition-all duration-300 ease-in-out md:flex ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Logo Area */}
        {/* Uses consistent flex layout matches NavItem: [w-20 Icon] [Animated Text] */}
        <div className="flex h-20 items-center overflow-hidden border-b border-[rgb(var(--border-base))]">
          <div className="flex h-full w-20 shrink-0 items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center">
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
              <div className="flex justify-center w-20">
                {/* Compact Theme Toggle when collapsed */}
                <ThemeToggleButton />
              </div>
            ) : (
              <div className="px-6 fade-in duration-300">
                <div className="mb-2 text-xs font-bold text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                  {t("common.theme")}
                </div>
                <ThemeSelector className="w-full" />
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="border-t border-[rgb(var(--border-base))]">
            <Dropdown
              align="left"
              side="top"
              className="w-60"
              trigger={
                <button className="group flex w-full items-center text-left transition-colors hover:bg-[rgb(var(--bg-muted))] overflow-hidden">
                  {/* Fixed Icon Area: Avatar */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center">
                    <Avatar
                      name={displayName}
                      src={ProfileService.getAvatarUrl(
                        auth.profile?.avatarFileId,
                      )}
                      size="md"
                      ring
                      className="transition-transform group-hover:scale-105"
                    />
                  </div>
                  {/* Animated Text Area */}
                  <div
                    className={`grid transition-[grid-template-columns] duration-300 ease-in-out ${
                      collapsed ? "grid-cols-[0fr]" : "grid-cols-[1fr]"
                    }`}
                  >
                    <div className="overflow-hidden pr-4">
                      <div className="truncate text-sm font-bold text-[rgb(var(--text-primary))]">
                        {displayName}
                      </div>
                      <div className="truncate text-xs text-[rgb(var(--text-secondary))]">
                        {auth.user?.email}
                      </div>
                    </div>
                  </div>
                </button>
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
              <DropdownItem
                icon={User}
                onClick={() => navigate("/app/profile")}
              >
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

      {/* ========== Desktop Main ========== */}
      <main
        className={`hidden min-h-dvh transition-all duration-300 ease-in-out md:block ${
          collapsed ? "md:pl-20" : "md:pl-72"
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

      {/* ========== Mobile Header ========== */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))/0.9] px-4 backdrop-blur-lg md:hidden">
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
                  {role.charAt(0).toUpperCase() + role.slice(1)}
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

        {/* Theme */}
        <DrawerSection title={t("common.theme")}>
          <ThemeSelector className="w-full justify-end" />
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
      <main className="min-h-dvh pt-14 pb-16 md:hidden">
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
        <div className="grid grid-cols-5 items-center px-1 py-1.5 pb-safe">
          {navItems.slice(0, 4).map((item) => (
            <div key={item.to} className="flex justify-center">
              <MobileNavItem {...item} />
            </div>
          ))}
          <div className="flex justify-center">
            <button
              onClick={onLogout}
              className="flex flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-semibold text-[rgb(var(--text-muted))] transition-all hover:text-[rgb(var(--text-primary))]"
            >
              <LogOut className="h-5 w-5" />
              <span className="truncate max-w-[60px]">
                {t("common.logout")}
              </span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
