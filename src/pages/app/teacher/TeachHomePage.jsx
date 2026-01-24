import React from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  BookOpen,
  Users,
  DollarSign,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { FileService } from "../../../shared/data/files";
import { StatsService } from "../../../shared/data/stats";

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
  const [courses, setCourses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    courses: 0,
    students: 0,
    revenue: 0,
  });

  React.useEffect(() => {
    if (auth.user?.$id) {
      loadDashboardData();
    }
  }, [auth.user?.$id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const myCourses = await TeacherCoursesService.listByTeacher(
        auth.user.$id,
      );
      setCourses(myCourses);

      // Calculate simple stats
      // For students/revenue, strictly we'd need aggregation from Enrollments collection
      // But we can estimate from courseStats if available, or just count courses for now
      // and update later with real aggregate queries.

      let totalStudents = 0;

      // If we want real student count, we'd need to fetch stats for all courses
      // This might be expensive if many courses, but okay for dashboard
      const courseIds = myCourses.map((c) => c.$id);
      if (courseIds.length > 0) {
        const statsMap = await StatsService.getStatsForCourses(courseIds);
        Object.values(statsMap).forEach((s) => {
          totalStudents += s.totalStudents || 0;
        });
      }

      setStats({
        courses: myCourses.length,
        students: totalStudents,
        revenue: 0, // Pending backend endpoint for revenue
      });
    } catch (error) {
      console.error("Failed to load dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const recentCourses = courses.slice(0, 5); // Show latest 5

  return (
    <PageLayout
      title="Panel de Profesor"
      subtitle={`Bienvenido, ${auth.profile?.firstName || "Maestro"}. Gestiona tus cursos y estudiantes.`}
      actions={
        <Link to="/app/teach/courses/new">
          <Button
            size="lg"
            className="w-full sm:w-auto shadow-lg shadow-[rgb(var(--brand-primary))/0.2]"
          >
            <Plus className="mr-2 h-5 w-5" /> Crear Nuevo Curso
          </Button>
        </Link>
      }
    >
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
          value="$0.00" // Placeholder until revenue tracking is implemented
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

          {loading ? (
            <Card className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            </Card>
          ) : recentCourses.length === 0 ? (
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
          ) : (
            <div className="space-y-4">
              {recentCourses.map((course) => (
                <Card
                  key={course.$id}
                  className="p-4 flex gap-4 items-center group transition-all hover:shadow-md hover:border-primary/20"
                >
                  {/* Thumbnail */}
                  <div className="h-16 w-24 shrink-0 rounded-lg bg-gray-100 overflow-hidden relative">
                    {course.coverFileId ? (
                      <img
                        src={FileService.getCourseCoverUrl(course.coverFileId, {
                          width: 200,
                        })}
                        className="h-full w-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="h-full w-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white/50" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base truncate group-hover:text-primary transition-colors">
                      <Link to={`/app/teach/courses/${course.$id}`}>
                        {course.title}
                      </Link>
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${course.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {course.isPublished ? "Publicado" : "Borrador"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(course.$updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        window.open(`/app/courses/${course.$id}`, "_blank")
                      }
                    >
                      <ArrowRight className="h-4 w-4 -rotate-45" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
    </PageLayout>
  );
}
