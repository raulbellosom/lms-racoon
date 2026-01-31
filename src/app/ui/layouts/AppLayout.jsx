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
  Tag,
  Ticket,
  ShoppingCart,
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
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";
import { useAuth } from "../../providers/AuthProvider";
import { useCart } from "../../../context/CartContext";
import { logout } from "../../../shared/services/auth";
import {
  useTheme,
  ThemeSelector,
  ThemeToggleButton,
} from "../../../shared/theme/ThemeProvider";
import { ThemeSelect } from "../../../shared/theme/ThemeSelect";
import { LanguageSelector } from "../../../shared/ui/LanguageSelector";
import { ProfileService } from "../../../shared/data/profiles";

import { CartDropdown } from "../../../features/cart/components/CartDropdown";
import { NotificationsPopover } from "../../../shared/components/NotificationsPopover";
import { GlobalSearch } from "../../../features/search/components/GlobalSearch";
import { SearchModal } from "../../../features/search/components/SearchModal";

/**
 * NavItem with precise fixed-width icon aligned.
 * Structure: [Fixed 5rem Icon Area] [Animated Text Area]
 */
function NavItem({ to, icon: Icon, label, onClick, collapsed, badge }) {
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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center relative">
            {/* The icon itself doesn't need a background anymore since the parent has it. */}
            <Icon
              className={`h-5 w-5 ${
                isActive ? "text-[rgb(var(--brand-primary))]" : ""
              }`}
            />
            {badge && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[rgb(var(--bg-surface))]">
                {badge}
              </span>
            )}
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

import { usePushNotifications } from "../../../features/notifications/hooks/usePushNotifications";

export function AppLayout() {
  usePushNotifications(); // Initialize Push Notifications logic
  const { t } = useTranslation();
  const { auth, authStore } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [searchModalOpen, setSearchModalOpen] = React.useState(false);
  const [avatarViewerOpen, setAvatarViewerOpen] = React.useState(false);

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
          {
            to: "/app/admin/categories",
            icon: Tag,
            label: t("nav.categories", "Categorías"),
          },
          {
            to: "/app/admin/coupons",
            icon: Ticket,
            label: t("nav.coupons", "Cupones"),
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
        {/* Search Bar */}
        <GlobalSearch className="w-96" />

        {/* Right Actions: User Profile */}
        <div className="flex items-center gap-4">
          <NotificationsPopover />
          <CartDropdown />
          <div className="h-8 w-px bg-[rgb(var(--border-base))]" />

          <Dropdown
            align="end"
            side="bottom"
            sideOffset={8}
            className="w-60 min-w-[240px]"
            open={isProfileOpen}
            onOpenChange={setIsProfileOpen}
            trigger={
              <button className="group flex items-center gap-3 transition-colors">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-[rgb(var(--text-primary))] max-w-[150px] truncate">
                    {displayName.length > 20
                      ? displayName.substring(0, 20) + "..."
                      : displayName}
                  </span>
                  <span className="text-xs text-[rgb(var(--text-secondary))] capitalize">
                    {t(`roles.${role}`, role)}
                  </span>
                </div>
                <Avatar
                  name={displayName}
                  src={ProfileService.getAvatarUrl(auth.profile?.avatarFileId)}
                  size="md"
                  ring
                  className="transition-transform group-hover:scale-105 cursor-pointer"
                  onClick={(e) => {
                    if (auth.profile?.avatarFileId) {
                      e.stopPropagation();
                      setAvatarViewerOpen(true);
                    }
                  }}
                />
              </button>
            }
          >
            <div className="px-3 py-2">
              <div className="text-xs font-bold text-[rgb(var(--text-primary))]">
                {displayName}
              </div>
              <div className="text-xs text-[rgb(var(--text-secondary))] truncate mb-1">
                {auth.user?.email}
              </div>
              <div className="text-xs text-[rgb(var(--text-tertiary))] capitalize">
                {t(`roles.${role}`, role)}
              </div>
            </div>
            <DropdownDivider />
            <DropdownItem
              icon={User}
              onClick={() => {
                navigate("/app/profile");
                setIsProfileOpen(false);
              }}
            >
              {t("nav.profile", "Mi Perfil")}
            </DropdownItem>
            <DropdownItem
              icon={Settings}
              onClick={() => {
                navigate("/app/settings");
                setIsProfileOpen(false);
              }}
            >
              {t("common.settings")}
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem
              icon={LogOut}
              onClick={() => {
                onLogout();
                setIsProfileOpen(false);
              }}
              danger
            >
              {t("common.logout")}
            </DropdownItem>
          </Dropdown>
        </div>
      </header>

      <main
        className={`hidden min-h-dvh pt-16 pb-12 transition-all duration-300 ease-in-out md:grid md:grid-cols-1 md:grid-rows-1 md:items-start ${
          collapsed ? "md:pl-16" : "md:pl-72"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="md:col-start-1 md:row-start-1 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
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
      <header className="fixed left-0 right-0 top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top,0px))] items-start justify-between border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))/0.9] px-4 pt-safe backdrop-blur-lg md:hidden">
        <div className="flex h-14 w-full items-center justify-between">
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchModalOpen(true)}
              className="rounded-full p-1 text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]"
            >
              <Search className="h-5 w-5" />
            </button>
            <NotificationsPopover />
            <CartDropdown />
          </div>
        </div>
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
                className="cursor-pointer"
                onClick={() => {
                  if (auth.profile?.avatarFileId) {
                    setAvatarViewerOpen(true);
                  }
                }}
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
            <NavItem
              to="/app/cart"
              icon={ShoppingCart}
              label={t("nav.cart", "Mi Carrito")}
              badge={cartItems.length > 0 ? cartItems.length : undefined}
              onClick={() => setDrawerOpen(false)}
            />
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

      <main className="min-h-dvh pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:hidden grid grid-cols-1 grid-rows-1 items-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="col-start-1 row-start-1 w-full min-h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
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
      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* Profile Avatar Viewer */}
      <ImageViewerModal
        isOpen={avatarViewerOpen}
        onClose={() => setAvatarViewerOpen(false)}
        src={ProfileService.getAvatarUrl(auth.profile?.avatarFileId)}
        alt={displayName}
        showDownload={false}
      />
    </div>
  );
}
