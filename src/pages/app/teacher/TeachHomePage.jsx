import React from "react";
import { Link } from "react-router-dom";
import { Plus, BookOpen, Users, DollarSign, ArrowRight } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";

function StatCard({ icon: Icon, label, value, colorClass }) {
  return (
    <Card className="flex items-center gap-4 p-5 transition-all hover:shadow-md">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-opacity-10 ${colorClass}`}
      >
        <Icon className={`h-6 w-6 ${colorClass.replace("bg-", "text-")}`} />
      </div>
      <div>
        <div className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
        </div>
        <div className="text-2xl font-black tracking-tight">{value}</div>
      </div>
    </Card>
  );
}

export function TeachHomePage() {
  const { auth } = useAuth();

  // TODO: Fetch real stats
  const stats = {
    courses: 0,
    students: 0,
    revenue: 0,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[rgb(var(--text-primary))]">
            Panel de Profesor
          </h1>
          <p className="mt-1 text-[rgb(var(--text-secondary))]">
            Bienvenido, {auth.profile?.firstName || "Maestro"}. Gestiona tus
            cursos y estudiantes.
          </p>
        </div>
        <Link to="/app/teach/courses/new">
          <Button
            size="lg"
            className="w-full sm:w-auto shadow-lg shadow-[rgb(var(--brand-primary))/0.2]"
          >
            <Plus className="mr-2 h-5 w-5" /> Crear Nuevo Curso
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard
          icon={BookOpen}
          label="Total Cursos"
          value={stats.courses}
          colorClass="bg-blue-500 text-blue-500"
        />
        <StatCard
          icon={Users}
          label="Estudiantes Activos"
          value={stats.students}
          colorClass="bg-green-500 text-green-500"
        />
        <StatCard
          icon={DollarSign}
          label="Ingresos Totales"
          value="$0.00"
          colorClass="bg-purple-500 text-purple-500"
        />
      </div>

      {/* Recent Activity or CTA */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Cursos Recientes</h2>
            <Link
              to="/app/teach/courses"
              className="text-sm font-semibold text-[rgb(var(--brand-primary))] hover:underline"
            >
              Ver todos &rarr;
            </Link>
          </div>

          <Card className="flex flex-col items-center justify-center py-12 text-center text-[rgb(var(--text-secondary))]">
            <div className="mb-4 rounded-full bg-[rgb(var(--bg-muted))] p-4">
              <BookOpen className="h-8 w-8 text-[rgb(var(--text-muted))]" />
            </div>
            <p className="font-medium">No hay actividad reciente</p>
            <p className="text-sm">Tus cursos creados aparecerán aquí.</p>
            <Link to="/app/teach/courses/new" className="mt-4">
              <Button variant="secondary" size="sm">
                Comenzar un curso
              </Button>
            </Link>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold">Acciones Rápidas</h2>
          <Card className="divide-y divide-[rgb(var(--border-base))]">
            <Link
              to="/app/teach/courses"
              className="flex w-full items-center justify-between p-4 transition hover:bg-[rgb(var(--bg-muted))]"
            >
              <span className="font-medium">Mis Cursos</span>
              <ArrowRight className="h-4 w-4 text-[rgb(var(--text-muted))]" />
            </Link>
            <Link
              to="/app/profile"
              className="flex w-full items-center justify-between p-4 transition hover:bg-[rgb(var(--bg-muted))]"
            >
              <span className="font-medium">Editar Perfil</span>
              <ArrowRight className="h-4 w-4 text-[rgb(var(--text-muted))]" />
            </Link>
            {/* Add more links as features are built */}
          </Card>
        </div>
      </div>
    </div>
  );
}
