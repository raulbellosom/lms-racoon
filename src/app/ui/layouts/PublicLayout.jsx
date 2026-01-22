import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { GraduationCap, LayoutGrid, LogIn } from "lucide-react";
import { ThemeToggleButton } from "../../../shared/theme/ThemeProvider";
import { Button } from "../../../shared/ui/Button";

export function PublicLayout() {
  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-base))/0.82] backdrop-blur-soft">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[rgb(var(--brand-primary))/0.15]">
              <GraduationCap className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-extrabold tracking-tight">Racoon LMS</div>
              <div className="text-xs text-[rgb(var(--text-secondary))]">Cursos modernos • PWA</div>
            </div>
          </NavLink>

          <nav className="ml-auto flex items-center gap-2">
            <NavLink
              to="/catalog"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]"
            >
              <LayoutGrid className="h-4 w-4" /> Catálogo
            </NavLink>

            <ThemeToggleButton className="!rounded-xl !border !border-[rgb(var(--border-base))] !bg-[rgb(var(--bg-surface))]" />

            <NavLink to="/auth/login">
              <Button variant="secondary" className="hidden sm:inline-flex">
                <LogIn className="h-4 w-4" /> Ingresar
              </Button>
            </NavLink>

            <NavLink to="/auth/register">
              <Button className="inline-flex">Crear cuenta</Button>
            </NavLink>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-[rgb(var(--border-base))] mt-12">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-[rgb(var(--text-secondary))]">
          © {new Date().getFullYear()} Racoon Devs — LMS demo (Appwrite-ready).
        </div>
      </footer>
    </div>
  );
}
