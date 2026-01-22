import React from "react";
import { Link } from "react-router-dom";
import { Plus, SquarePen, Video } from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";

export function TeachHomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-black tracking-tight">Panel maestro</div>
          <div className="text-sm text-[rgb(var(--text-secondary))]">
            Crea cursos, agrega lecciones y publica.
          </div>
        </div>
        <Link to="/app/teach/courses">
          <Button>
            <SquarePen className="h-4 w-4" /> Mis cursos
          </Button>
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <div className="inline-flex items-center gap-2 text-sm font-extrabold">
            <Video className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
            Subir videos
          </div>
          <div className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            Usa Storage (bucket lessonVideos) y referencia en lessons.videoFileId.
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-extrabold">Tip</div>
          <div className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            Tu curso se compone de sections + lessons. Es flexible y escalable.
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-extrabold">Siguiente</div>
          <div className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            Conecta pagos con Appwrite Functions (Stripe/MercadoPago) y marca enrollment.status=paid.
          </div>
          <div className="mt-3">
            <Link to="/app/teach/courses">
              <Button size="sm" variant="secondary">
                <Plus className="h-4 w-4" /> Crear curso
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
