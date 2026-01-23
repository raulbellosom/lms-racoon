import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";

import { PageLayout } from "../../../shared/ui/PageLayout";
import { CatalogFilters } from "../components/CatalogFilters";
import { CatalogCourseCard } from "../components/CatalogCourseCard";
import { Drawer } from "../../../shared/ui/Drawer";
import { Button } from "../../../shared/ui/Button";

// Mock data until we have the service
const MOCK_CATEGORIES = [
  { $id: "1", name: "Desarrollo" },
  { $id: "2", name: "Diseño" },
  { $id: "3", name: "Negocios" },
  { $id: "4", name: "Marketing" },
];

const MOCK_COURSES = [
  {
    $id: "c1",
    title: "Master en React 2024: De Cero a Experto",
    subtitle: "Aprende Hooks, Context, Redux y crea aplicaciones reales.",
    category: "Desarrollo",
    level: "advanced",
    priceCents: 19999,
    rating: 4.9,
    studentsCount: 1540,
    coverUrl:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600",
  },
  {
    $id: "c2",
    title: "UI/UX Design Bootcamp",
    subtitle:
      "Diseña interfaces modernas y experiencias de usuario increíbles.",
    category: "Diseño",
    level: "beginner",
    priceCents: 24900,
    rating: 4.7,
    studentsCount: 890,
    coverUrl:
      "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?auto=format&fit=crop&q=80&w=600",
  },
  {
    $id: "c3",
    title: "Marketing Digital para Emprendedores",
    subtitle: "Estrategias de crecimiento, SEO y redes sociales.",
    category: "Marketing",
    level: "intermediate",
    priceCents: 0,
    rating: 4.5,
    studentsCount: 3200,
    coverUrl:
      "https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&q=80&w=600",
  },
  {
    $id: "c4",
    title: "Finanzas Personales 101",
    subtitle: "Toma el control de tu dinero e invierte inteligentemente.",
    category: "Negocios",
    level: "beginner",
    priceCents: 14900,
    rating: 4.8,
    studentsCount: 500,
    coverUrl:
      "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=600",
  },
];

export function CatalogView() {
  const { t } = useTranslation();
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);
  const [filters, setFilters] = React.useState({
    search: "",
    categories: [],
    levels: [],
  });

  // Filter logic (simple client-side for now)
  const filteredCourses = React.useMemo(() => {
    return MOCK_COURSES.filter((course) => {
      // Search
      if (
        filters.search &&
        !course.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      // Categories (using name match for mock simplicity, purely by chance if IDs matched)
      // In real app compare IDs. Here mock has category names.
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(
          MOCK_CATEGORIES.find((c) => c.name === course.category)?.$id,
        )
      ) {
        return false;
      }
      // Levels
      if (filters.levels.length > 0 && !filters.levels.includes(course.level)) {
        return false;
      }
      return true;
    });
  }, [filters]);

  return (
    <div className="min-h-dvh bg-[rgb(var(--bg-base))] pb-20">
      {/* Header / Hero specific to Catalog if not using generic PageLayout title only */}
      <div className="bg-[rgb(var(--bg-surface))] border-b border-[rgb(var(--border-base))] px-6 py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight text-[rgb(var(--text-primary))] md:text-5xl"
          >
            {t("catalog.title", "Explora Cursos")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 max-w-2xl text-lg text-[rgb(var(--text-secondary))]"
          >
            {t(
              "catalog.subtitle",
              "Descubre contenido de clase mundial para llevar tu carrera al siguiente nivel.",
            )}
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <CatalogFilters
              filters={filters}
              onChange={setFilters}
              categories={MOCK_CATEGORIES}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                <input
                  type="text"
                  placeholder={t(
                    "catalog.searchPlaceholder",
                    "Buscar cursos...",
                  )}
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] py-3 pl-10 pr-4 outline-none transition focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgb(var(--brand-primary))/0.2]"
                />
              </div>
              <Button
                variant="secondary"
                className="lg:hidden"
                onClick={() => setShowMobileFilters(true)}
              >
                <Filter className="mr-2 h-4 w-4" /> Filtros
              </Button>
            </div>

            {/* Results Grid */}
            {filteredCourses.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course) => (
                  <CatalogCourseCard key={course.$id} course={course} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-[rgb(var(--bg-surface))] p-8 text-center border border-[rgb(var(--border-base))] border-dashed">
                <div className="mb-4 rounded-full bg-[rgb(var(--bg-muted))] p-4 text-[rgb(var(--text-muted))]">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-[rgb(var(--text-primary))]">
                  No se encontraron cursos
                </h3>
                <p className="mt-2 text-[rgb(var(--text-secondary))]">
                  Intenta ajustar tus filtros o búsqueda.
                </p>
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() =>
                    setFilters({ search: "", categories: [], levels: [] })
                  }
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <Drawer
        open={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        title="Filtros"
      >
        <div className="p-4">
          <CatalogFilters
            filters={filters}
            onChange={setFilters}
            categories={MOCK_CATEGORIES}
          />
          <div className="mt-8">
            <Button
              className="w-full"
              onClick={() => setShowMobileFilters(false)}
            >
              Ver {filteredCourses.length} cursos
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
