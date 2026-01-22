import React from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, ShieldAlert } from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";

/**
 * Placeholder UI. Connect to:
 * - courses where teacherId == currentUserId
 */
export function TeacherCoursesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-black tracking-tight">Mis cursos</div>
          <div className="text-sm text-[rgb(var(--text-secondary))]">
            Administra tu catálogo.
          </div>
        </div>
        <Link to="/app/teach/courses/new">
          <Button>
            <Plus className="h-4 w-4" /> Nuevo curso
          </Button>
        </Link>
      </div>

      <Card className="mt-4 p-4">
        <div className="flex items-center gap-2 text-sm font-extrabold">
          <ShieldAlert className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
          Nota
        </div>
        <div className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
          Este demo incluye la UI del panel maestro. Para activar CRUD real, conecta los endpoints a Appwrite DB:
          <code className="ml-2 rounded-lg bg-[rgb(var(--bg-muted))] px-2 py-1 text-xs">courses / courseSections / lessons</code>.
        </div>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-28 rounded-2xl bg-[rgb(var(--bg-muted))]" />
            <div className="mt-3 text-sm font-extrabold">Curso #{i + 1}</div>
            <div className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
              Borrador • 0 estudiantes
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1">
                <Pencil className="h-4 w-4" /> Editar
              </Button>
              <Button size="sm" className="flex-1">Publicar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
