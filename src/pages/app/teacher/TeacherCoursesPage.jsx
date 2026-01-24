import React from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Star,
  BarChart,
  Eye,
} from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { StatsService } from "../../../shared/data/stats";
import { FileService } from "../../../shared/data/files";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { CourseGridSkeleton } from "../../../shared/ui/Skeleton";

export function TeacherCoursesPage() {
  const { auth } = useAuth();
  const [courses, setCourses] = React.useState([]);
  const [stats, setStats] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (auth.user?.$id) {
      loadCourses();
    }
  }, [auth.user?.$id]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await TeacherCoursesService.listByTeacher(auth.user.$id);
      setCourses(data);

      // Fetch stats
      const courseIds = data.map((c) => c.$id);
      const statsData = await StatsService.getStatsForCourses(courseIds);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load courses", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[rgb(var(--text-primary))]">
            Mis Cursos
          </h1>
          <p className="mt-1 text-[rgb(var(--text-secondary))]">
            Administra y organiza tu contenido educativo.
          </p>
        </div>
        <Link to="/app/teach/courses/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Curso
          </Button>
        </Link>
      </div>

      {/* Filters */}
      {courses.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <Input
              placeholder="Buscar curso..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <CourseGridSkeleton count={6} />
      ) : filteredCourses.length === 0 ? (
        <Card className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 rounded-full bg-[rgb(var(--bg-muted))] p-6">
            <BookOpen className="h-10 w-10 text-[rgb(var(--text-muted))]" />
          </div>
          <h3 className="text-xl font-bold">No tienes cursos todavía</h3>
          <p className="mt-2 max-w-sm text-[rgb(var(--text-secondary))]">
            Comienza a compartir tu conocimiento creando tu primer curso. Es
            fácil y rápido.
          </p>
          <Link to="/app/teach/courses/new" className="mt-6">
            <Button>Crear mi primer curso</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const coverUrl = course.coverFileId
              ? FileService.getCourseCoverUrl(course.coverFileId)
              : null;
            const courseStats = stats[course.$id] || {};

            return (
              <Card
                key={course.$id}
                className="group relative flex h-[340px] flex-col overflow-hidden border-0 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Background Image / Gradient */}
                <div className="absolute inset-0 z-0 bg-[rgb(var(--bg-muted))]">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-80">
                      <BookOpen className="h-12 w-12 text-white/50" />
                    </div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/60 to-transparent" />
                </div>

                {/* Status Badge */}
                <div className="absolute right-3 top-3 z-10">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs backdrop-blur-md ${
                      course.isPublished
                        ? "bg-green-500/90"
                        : "bg-black/50 border border-white/20"
                    }`}
                  >
                    {course.isPublished ? "Publicado" : "Borrador"}
                  </span>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 mt-auto flex flex-col p-5 text-white">
                  <div className="mb-2">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">
                      {course.category?.name || "Curso"}
                    </span>
                  </div>

                  <h3
                    className="mb-1 line-clamp-2 text-xl font-bold leading-tight text-white drop-shadow-sm"
                    title={course.title}
                  >
                    {course.title}
                  </h3>

                  <p className="mb-4 line-clamp-2 text-xs font-medium text-gray-300">
                    {course.subtitle || "Sin descripción corta"}
                  </p>

                  {/* Metadata Footer */}
                  <div className="flex flex-col gap-3 border-t border-white/10 pt-3">
                    {/* Stats Row */}
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex items-center gap-1"
                          title="Alumnos"
                        >
                          <Users className="h-3.5 w-3.5 text-blue-300" />
                          <span className="font-semibold">
                            {courseStats.totalStudents || 0}
                          </span>
                        </span>
                        <span
                          className="flex items-center gap-1"
                          title="Rating"
                        >
                          <Star
                            className="h-3.5 w-3.5 text-yellow-400"
                            fill="currentColor"
                          />
                          <span className="font-semibold">
                            {courseStats.averageRating || 0}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {course.priceCents === 0 ? (
                          <span className="font-bold text-emerald-300">
                            Gratis
                          </span>
                        ) : (
                          <span className="font-bold text-amber-300">
                            {(course.priceCents / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <BarChart className="h-3 w-3" />
                        <span className="capitalize">
                          {course.level || "General"}
                        </span>
                      </span>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-white/70 hover:bg-white/10 hover:text-white"
                          title="Vista previa"
                          onClick={() =>
                            window.open(`/app/courses/${course.$id}`, "_blank")
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Link to={`/app/teach/courses/${course.$id}`}>
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 border border-white/10"
                          >
                            Editar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
