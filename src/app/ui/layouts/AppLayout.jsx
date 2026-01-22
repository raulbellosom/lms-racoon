import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BookOpen, Home, LineChart, LogOut, Settings, SquarePen } from "lucide-react";
import { ThemeToggleButton } from "../../../shared/theme/ThemeProvider";
import { Button } from "../../../shared/ui/Button";
import { useAuth } from "../../providers/AuthProvider";
import { logout } from "../../../shared/services/auth";

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition",
          isActive
            ? "bg-[rgb(var(--brand-primary))/0.14] text-[rgb(var(--brand-primary))]"
            : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]",
        ].join(" ")
      }
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function AppLayout() {
  const { auth } = useAuth();
  const navigate = useNavigate();

  const role = auth.profile?.role || "student";

  const onLogout = async () => {
    await logout().catch(() => {});
    navigate("/");
  };

  return (
    <div className="min-h-[100dvh]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <aside className="fixed inset-y-0 left-0 w-72 border-r border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]">
          <div className="p-4">
            <div className="rounded-[var(--radius)] bg-[rgb(var(--bg-muted))] p-3">
              <div className="text-sm font-extrabold tracking-tight">Racoon LMS</div>
              <div className="text-xs text-[rgb(var(--text-secondary))]">
                Hola, {auth.profile?.displayName || auth.user?.name || "👋"}
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <NavItem to="/app/home" icon={Home} label="Inicio" />
              <NavItem to="/app/my-courses" icon={BookOpen} label="Mis cursos" />
              <NavItem to="/app/progress" icon={LineChart} label="Progreso" />
              {role !== "student" ? (
                <NavItem to="/app/teach" icon={SquarePen} label="Panel maestro" />
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[rgb(var(--border-base))] p-3">
              <div className="text-xs text-[rgb(var(--text-secondary))]">Tema</div>
              <ThemeToggleButton className="!rounded-xl !border !border-[rgb(var(--border-base))] !bg-[rgb(var(--bg-surface))]" />
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1">
                <Settings className="h-4 w-4" /> Ajustes
              </Button>
              <Button variant="secondary" onClick={onLogout} className="flex-1">
                <LogOut className="h-4 w-4" /> Salir
              </Button>
            </div>
          </div>
        </aside>

        <main className="ml-72 w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden">
        <main className="pb-20">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))/0.9] backdrop-blur-soft">
          <div className="mx-auto max-w-6xl px-3 py-2 grid grid-cols-4 gap-2">
            <NavLink to="/app/home" className="grid place-items-center gap-1 rounded-2xl py-2 text-xs font-semibold text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]">
              <Home className="h-5 w-5" /> Inicio
            </NavLink>
            <NavLink to="/app/my-courses" className="grid place-items-center gap-1 rounded-2xl py-2 text-xs font-semibold text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]">
              <BookOpen className="h-5 w-5" /> Cursos
            </NavLink>
            <NavLink to="/app/progress" className="grid place-items-center gap-1 rounded-2xl py-2 text-xs font-semibold text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]">
              <LineChart className="h-5 w-5" /> Progreso
            </NavLink>
            <button onClick={onLogout} className="grid place-items-center gap-1 rounded-2xl py-2 text-xs font-semibold text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]">
              <LogOut className="h-5 w-5" /> Salir
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
