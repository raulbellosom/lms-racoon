import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "../../shared/ui/Button";
import { CourseCard } from "../../components/courses/CourseCard";
import { listPublishedCourses } from "../../shared/data/courses";

export function LandingPage() {
  const [courses, setCourses] = React.useState([]);

  React.useEffect(() => {
    listPublishedCourses({ limit: 6 }).then(setCourses).catch(() => setCourses([]));
  }, []);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 py-2 text-xs text-[rgb(var(--text-secondary))]"
            >
              <Sparkles className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
              Cursos con tareas • Q&A • Reviews • PWA
            </motion.div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Aprende con una plataforma tipo Udemy,
              <span className="text-[rgb(var(--brand-primary))]"> pero más simple</span>.
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--text-secondary))] sm:text-base">
              Cursos con video, progreso del alumno, panel para maestros y una experiencia responsiva
              que se siente como app nativa.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link to="/catalog">
                <Button size="lg" className="w-full sm:w-auto">
                  Explorar cursos <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Crear cuenta gratis
                </Button>
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-4">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <PlayCircle className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
                  Video + capítulos
                </div>
                <div className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
                  Lecciones cortas, claras y con recursos.
                </div>
              </div>
              <div className="rounded-[var(--radius)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-4">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <ShieldCheck className="h-5 w-5 text-[rgb(var(--brand-primary))]" />
                  Progreso real
                </div>
                <div className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
                  Marcado de lecciones, avance y panel.
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-3 rounded-[calc(var(--radius)+10px)] bg-[radial-gradient(circle_at_top,rgb(var(--brand-primary)/0.22),transparent_60%)]" />
            <div className="relative rounded-[calc(var(--radius)+10px)] border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-4 shadow-soft">
              <div className="text-xs font-semibold text-[rgb(var(--text-secondary))]">
                Vista previa real (mobile-first)
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {courses.slice(0, 4).map((c) => (
                  <Link key={c.$id} to={`/courses/${c.$id}`} className="block">
                    <CourseCard course={c} compact />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-extrabold tracking-tight">Cursos destacados</div>
            <div className="text-xs text-[rgb(var(--text-secondary))]">
              Hechos para aprender rápido, sin fricción.
            </div>
          </div>
          <Link to="/catalog" className="text-sm font-semibold text-[rgb(var(--brand-primary))]">
            Ver todo →
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.$id} to={`/courses/${c.$id}`} className="block">
              <CourseCard course={c} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
