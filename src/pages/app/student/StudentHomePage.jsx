import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { listPublishedCourses } from "../../../shared/data/courses";
import { listMyEnrollments } from "../../../shared/data/enrollments";
import { CourseCard } from "../../../components/courses/CourseCard";

export function StudentHomePage() {
  const { auth } = useAuth();
  const [enrolledCourseIds, setEnrolledCourseIds] = React.useState([]);
  const [recommendations, setRecommendations] = React.useState([]);

  React.useEffect(() => {
    listMyEnrollments({ userId: auth.user?.$id })
      .then((docs) => setEnrolledCourseIds(docs.map((d) => d.courseId)))
      .catch(() => setEnrolledCourseIds([]));
  }, [auth.user?.$id]);

  React.useEffect(() => {
    listPublishedCourses({ limit: 6 })
      .then(({ documents }) => setRecommendations(documents))
      .catch(() => setRecommendations([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-black tracking-tight">Inicio</div>
          <div className="text-sm text-[rgb(var(--text-secondary))]">
            Hola, {auth.profile?.displayName || auth.user?.name} 👋
          </div>
        </div>
        <Link to="/catalog">
          <Button variant="secondary">
            Explorar <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Card className="mt-4 p-4">
        <div className="flex items-center gap-2 text-sm font-extrabold">
          <Sparkles className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
          Tu panel rápido
        </div>
        <div className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
          Continúa donde te quedaste y mantén tu progreso al día.
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[rgb(var(--bg-muted))] p-3">
            <div className="text-xs text-[rgb(var(--text-secondary))]">
              Cursos inscritos
            </div>
            <div className="mt-1 text-2xl font-black">
              {enrolledCourseIds.length}
            </div>
          </div>
          <div className="rounded-2xl bg-[rgb(var(--bg-muted))] p-3">
            <div className="text-xs text-[rgb(var(--text-secondary))]">
              Racha
            </div>
            <div className="mt-1 text-2xl font-black text-[rgb(var(--text-muted))]">
              -
            </div>
          </div>
          <div className="rounded-2xl bg-[rgb(var(--bg-muted))] p-3">
            <div className="text-xs text-[rgb(var(--text-secondary))]">
              Tiempo hoy
            </div>
            <div className="mt-1 text-2xl font-black text-[rgb(var(--text-muted))]">
              -
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-sm font-extrabold tracking-tight">
            Recomendados
          </div>
          <div className="text-xs text-[rgb(var(--text-secondary))]">
            Hechos para móvil: lectura clara y botones grandes.
          </div>
        </div>
        <Link
          to="/catalog"
          className="text-sm font-semibold text-[rgb(var(--brand-primary))]"
        >
          Ver todo →
        </Link>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((c) => (
          <CourseCard key={c.$id} course={c} />
        ))}
      </div>
    </div>
  );
}
