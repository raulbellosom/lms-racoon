import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "../../shared/ui/Input";
import { CourseCard } from "../../components/courses/CourseCard";
import { listPublishedCourses } from "../../shared/data/courses";

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = React.useState(params.get("q") || "");
  const [courses, setCourses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      listPublishedCourses({ q })
        .then((data) => setCourses(data.documents))
        .finally(() => setLoading(false));

      const next = new URLSearchParams(params);
      if (q) next.set("q", q);
      else next.delete("q");
      setParams(next, { replace: true });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xl font-black tracking-tight">Catálogo</div>
          <div className="text-sm text-[rgb(var(--text-secondary))]">
            Busca, explora y aprende en móvil como prioridad.
          </div>
        </div>

        <div className="relative w-full sm:w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--text-muted))]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cursos..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-(--radius) border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]"
            />
          ))
        ) : courses.length ? (
          courses.map((c) => (
            <Link key={c.$id} to={`/courses/${c.$id}`} className="block">
              <CourseCard course={c} />
            </Link>
          ))
        ) : (
          <div className="col-span-full rounded-(--radius) border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-6 text-sm text-[rgb(var(--text-secondary))]">
            No encontramos cursos con ese texto.
          </div>
        )}
      </div>
    </div>
  );
}
