import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { PageLayout } from "../../../shared/ui/PageLayout";
import { CatalogFilters } from "../components/CatalogFilters";
import { CourseCard } from "../../../components/courses/CourseCard";
import { Drawer } from "../../../shared/ui/Drawer";
import { Button } from "../../../shared/ui/Button";
import {
  listPublishedCourses,
  getCourseById,
} from "../../../shared/data/courses";
import { CategoryService } from "../../../shared/data/categories";

export function CatalogView() {
  const { t } = useTranslation();
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // Data states
  const [categories, setCategories] = React.useState([]);
  const [courses, setCourses] = React.useState([]);
  const [totalCourses, setTotalCourses] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Filters state
  const [filters, setFilters] = React.useState({
    search: "",
    categories: [],
    // Levels logic would require backend support or client-side filter if small dataset
    // For now we will keep the UI but maybe disable functionality or implementing client-side if needed.
    // The user request focused on API integration.
    levels: [],
  });

  const [page, setPage] = React.useState(1);
  const LIMIT = 12;

  // Fetch Categories
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await CategoryService.list({ limit: 100 });
        setCategories(res.documents);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Courses
  React.useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        // Prepare API params
        // Note: Our modified service supports single categoryId, but UI supports multiple.
        // We will fetch by the first category selected for now, or consider strict filtering.
        // If we want multiple categories OR logic, we need advanced Appwrite queries or multiple requests.
        // For simplicity and matching typical patterns, let's filter by the first selected category if any.
        const categoryId =
          filters.categories.length > 0 ? filters.categories[0] : "";

        // Debounce search could be added here, but relying on effect for now
        const { documents, total } = await listPublishedCourses({
          q: filters.search,
          categoryId,
          page,
          limit: LIMIT,
        });

        // If client-side level filtering is desired, we could do it here,
        // but pagination complicates it. Ideally levels are a query param.
        // Checking if we should filter client side for levels:
        let displayDocs = documents;
        if (filters.levels.length > 0) {
          displayDocs = documents.filter((doc) =>
            filters.levels.includes(doc.level),
          );
        }

        setCourses(displayDocs);
        setTotalCourses(total);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search slightly
    const timeoutId = setTimeout(fetchCourses, 300);
    return () => clearTimeout(timeoutId);
  }, [filters.search, filters.categories, filters.levels, page]);

  // Reset page on filter change
  React.useEffect(() => {
    setPage(1);
  }, [filters.search, filters.categories, filters.levels]);

  const totalPages = Math.ceil(totalCourses / LIMIT);

  return (
    <div className="min-h-dvh bg-[rgb(var(--bg-base))] pb-20">
      {/* Header / Hero */}
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
              categories={categories}
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

            {/* Loading State */}
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--brand-primary))]" />
              </div>
            ) : (
              <>
                {/* Results Grid */}
                {courses.length > 0 ? (
                  <div className="space-y-8">
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {courses.map((course) => (
                        <CourseCard key={course.$id} course={course} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          disabled={page === 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Anterior
                        </Button>
                        <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                          Página {page} de {totalPages}
                        </span>
                        <Button
                          variant="ghost"
                          disabled={page === totalPages}
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
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
              </>
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
            categories={categories}
          />
          <div className="mt-8">
            <Button
              className="w-full"
              onClick={() => setShowMobileFilters(false)}
            >
              Ver {courses.length} resultados
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
