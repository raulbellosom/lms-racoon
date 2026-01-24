import React from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  MoreVertical,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { TeacherCoursesService } from "../../../shared/data/courses-teacher";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { Dropdown, DropdownItem } from "../../../shared/ui/Dropdown";

export function TeacherCoursesPage() {
  const { auth } = useAuth();
  const [courses, setCourses] = React.useState([]);
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
          {filteredCourses.map((course) => (
            <Card
              key={course.$id}
              className="group overflow-hidden transition-all hover:shadow-lg"
            >
              {/* Cover Image */}
              <div className="relative h-48 w-full bg-[rgb(var(--bg-muted))]">
                {course.coverFileId ? (
                  // TODO: Resolve real image URL
                  <div className="flex h-full items-center justify-center text-[rgb(var(--text-muted))]">
                    Cover Image
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center bg-linear-to-br from-indigo-500/10 to-purple-500/10">
                    <BookOpen className="h-10 w-10 text-indigo-500/30" />
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-bold shadow-xs backdrop-blur-md ${course.isPublished ? "bg-green-500/90 text-white" : "bg-gray-500/90 text-white"}`}
                  >
                    {course.isPublished ? "Publicado" : "Borrador"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3
                  className="line-clamp-1 text-lg font-bold"
                  title={course.title}
                >
                  {course.title}
                </h3>
                <p className="mt-1 text-xs font-semibold text-[rgb(var(--brand-primary))]">
                  {/* Category would need lookup or duplicate field */}
                  Categoría
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-[rgb(var(--text-secondary))]">
                  {course.subtitle || "Sin descripción corta"}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-[rgb(var(--border-base))] pt-4">
                  <span className="text-xs font-medium text-[rgb(var(--text-muted))]">
                    Actualizado:{" "}
                    {new Date(course.$updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Link to={`/app/teach/courses/${course.$id}`}>
                      <Button size="sm" variant="secondary">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
