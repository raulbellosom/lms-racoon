import React from "react";
import { useParams } from "react-router-dom";
import { BookText, Layers3, UploadCloud } from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";

function TabButton({ active, icon: Icon, children, ...props }) {
  return (
    <button
      className={[
        "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition",
        active
          ? "bg-[rgb(var(--brand-primary))/0.14] text-[rgb(var(--brand-primary))]"
          : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))]",
      ].join(" ")}
      {...props}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

export function TeacherCourseEditorPage() {
  const { courseId } = useParams();
  const [tab, setTab] = React.useState("details");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div>
        <div className="text-xl font-black tracking-tight">Editor de curso</div>
        <div className="text-sm text-[rgb(var(--text-secondary))]">
          {courseId}
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
        <TabButton active={tab === "details"} onClick={() => setTab("details")} icon={BookText}>
          Detalles
        </TabButton>
        <TabButton active={tab === "curriculum"} onClick={() => setTab("curriculum")} icon={Layers3}>
          Curriculum
        </TabButton>
        <TabButton active={tab === "publish"} onClick={() => setTab("publish")} icon={UploadCloud}>
          Publicar
        </TabButton>
      </div>

      {tab === "details" ? (
        <Card className="mt-4 p-4">
          <div className="text-sm font-extrabold">Información del curso</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">
                Título
              </div>
              <Input placeholder="Ej: React Moderno..." />
            </label>
            <label className="block">
              <div className="mb-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">
                Subtítulo
              </div>
              <Input placeholder="Ej: Construye PWAs..." />
            </label>
            <label className="block sm:col-span-2">
              <div className="mb-1 text-xs font-semibold text-[rgb(var(--text-secondary))]">
                Descripción
              </div>
              <textarea className="min-h-28 w-full rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-3 text-sm" placeholder="Qué aprenderán..." />
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <Button>Guardar</Button>
            <Button variant="secondary">Vista previa</Button>
          </div>
        </Card>
      ) : null}

      {tab === "curriculum" ? (
        <Card className="mt-4 p-4">
          <div className="text-sm font-extrabold">Secciones y lecciones</div>
          <div className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            Aquí va el constructor visual: crear secciones, ordenar, y añadir lecciones (video/quiz/archivo).
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[var(--radius)] border border-[rgb(var(--border-base))] p-3">
                <div className="text-sm font-extrabold">Sección {i + 1}</div>
                <div className="mt-2 space-y-2">
                  {Array.from({ length: 3 }).map((__, j) => (
                    <div key={j} className="rounded-2xl bg-[rgb(var(--bg-muted))] p-3 text-sm">
                      Lección {j + 1}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" className="flex-1">+ Lección</Button>
                  <Button size="sm" className="flex-1">+ Sección</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {tab === "publish" ? (
        <Card className="mt-4 p-4">
          <div className="text-sm font-extrabold">Publicación</div>
          <div className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
            Recomendado: valida que todas las lecciones tengan videoFileId y duración.
          </div>

          <div className="mt-4 flex gap-2">
            <Button>Publicar</Button>
            <Button variant="secondary">Guardar como borrador</Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
