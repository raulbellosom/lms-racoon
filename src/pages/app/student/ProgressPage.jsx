import React from "react";
import { LineChart, Trophy } from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { ProgressBar } from "../../../shared/ui/ProgressBar";

export function ProgressPage() {
  // Placeholder UI — connect to lessonProgress + enrollments when ready.
  const weekly = [30, 55, 15, 70, 40, 90, 60];
  const pct = 46;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div>
        <div className="text-xl font-black tracking-tight">Progreso</div>
        <div className="text-sm text-[rgb(var(--text-secondary))]">Mide tu avance con claridad.</div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <div className="inline-flex items-center gap-2 text-sm font-extrabold">
            <LineChart className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
            Avance general
          </div>
          <div className="mt-4">
            <ProgressBar value={pct} />
            <div className="mt-2 text-sm text-[rgb(var(--text-secondary))]">{pct}% completado</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="inline-flex items-center gap-2 text-sm font-extrabold">
            <Trophy className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
            Logros
          </div>
          <div className="mt-3 text-sm text-[rgb(var(--text-secondary))]">
            2 cursos terminados • 1 certificado
          </div>
        </Card>

        <Card className="p-4 sm:col-span-2 lg:col-span-1">
          <div className="text-sm font-extrabold">Semana</div>
          <div className="mt-3 flex items-end gap-1 h-24">
            {weekly.map((v, i) => (
              <div key={i} className="flex-1 rounded-xl bg-[rgb(var(--bg-muted))] overflow-hidden">
                <div className="w-full bg-[rgb(var(--brand-primary))]" style={{ height: `${v}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-[rgb(var(--text-secondary))]">Minutos estudiados (demo)</div>
        </Card>
      </div>
    </div>
  );
}
