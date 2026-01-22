import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, PlayCircle } from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { useAuth } from "../../../app/providers/AuthProvider";
import { listMyEnrollments } from "../../../shared/data/enrollments";
import { getCourseById } from "../../../shared/data/courses";

export function MyCoursesPage() {
  const { auth } = useAuth();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    listMyEnrollments({ userId: auth.user.$id })
      .then(async (enrs) => {
        const courses = await Promise.all(enrs.map((e) => getCourseById(e.courseId).catch(() => null)));
        setItems(courses.filter(Boolean));
      })
      .finally(() => setLoading(false));
  }, [auth.user.$id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div>
        <div className="text-xl font-black tracking-tight">Mis cursos</div>
        <div className="text-sm text-[rgb(var(--text-secondary))]">
          Accede rápido y continúa aprendiendo.
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[var(--radius)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]" />
          ))
        ) : items.length ? (
          items.map((c) => (
            <Card key={c.$id} className="p-4">
              <div className="flex gap-3">
                <img src={c.coverUrl} alt={c.title} className="h-16 w-24 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold line-clamp-2">{c.title}</div>
                  <div className="mt-1 text-xs text-[rgb(var(--text-secondary))] line-clamp-1">
                    {c.teacherName}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Link to={`/app/learn/${c.$id}`}>
                      <Button size="sm">
                        <PlayCircle className="h-4 w-4" /> Continuar
                      </Button>
                    </Link>
                    <Link to={`/courses/${c.$id}`}>
                      <Button size="sm" variant="secondary">
                        <BookOpen className="h-4 w-4" /> Ver
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6 text-sm text-[rgb(var(--text-secondary))]">
            Aún no tienes cursos. Ve al <Link className="font-semibold text-[rgb(var(--brand-primary))]" to="/catalog">catálogo</Link>.
          </Card>
        )}
      </div>
    </div>
  );
}
