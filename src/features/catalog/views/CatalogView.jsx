import React from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { motion } from "framer-motion";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingContent } from "../../../shared/ui/LoadingScreen";

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

  // useSearchParams to sync filters with URL
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL
  const filters = React.useMemo(
    () => ({
      search: searchParams.get("search") || "",
      categories: searchParams.get("categories")
        ? searchParams.get("categories").split(",")
        : [],
      levels: searchParams.get("levels")
        ? searchParams.get("levels").split(",")
        : [],
      myCoursesOnly: searchParams.get("myCourses") === "true",
    }),
    [searchParams],
  );

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.categories.length > 0)
      params.set("categories", newFilters.categories.join(","));
    if (newFilters.levels.length > 0)
      params.set("levels", newFilters.levels.join(","));
    if (newFilters.myCoursesOnly) params.set("myCourses", "true");

    setSearchParams(params);
    setPage(1); // Reset page on filter change
  };

  const { auth } = useAuth();

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
        const categoryId =
          filters.categories.length > 0 ? filters.categories[0] : "";

        let teacherId = "";
        let excludeTeacherId = "";

        // If user is teacher/admin:
        // - if myCoursesOnly is TRUE -> Show ONLY my courses (teacherId = me)
        // - if myCoursesOnly is FALSE -> Show all EXCEPT my courses (excludeTeacherId = me)
        // Wait for auth to be ready
        if (
          auth.user &&
          (auth.profile?.role === "teacher" || auth.profile?.role === "admin")
        ) {
          if (filters.myCoursesOnly) {
            teacherId = auth.user.$id;
          } else {
            excludeTeacherId = auth.user.$id;
          }
        }

        const { documents, total } = await listPublishedCourses({
          q: filters.search,
          categoryId,
          page,
          limit: LIMIT,
          teacherId,
          excludeTeacherId,
        });

        // Client-side level filtering
        let displayDocs = documents;
        // Logic for client-side filtering if needed

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
  }, [filters, page, auth.user]); // Added auth.user dependency to re-run when auth loads

  const totalPages = Math.ceil(totalCourses / LIMIT);

  return (
    <div className="min-h-dvh bg-[rgb(var(--bg-base))] pb-20">
      {/* Header / Hero */}
      <div className="relative overflow-hidden bg-[rgb(var(--bg-surface))] pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000"
            alt="Students learning"
            className="h-full w-full object-cover opacity-20 dark:opacity-10"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-[rgb(var(--bg-surface)/0.8)] to-[rgb(var(--bg-base))]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center md:items-start md:text-left"
          >
            <span className="mb-4 inline-flex items-center rounded-full bg-[rgb(var(--brand-primary)/0.1)] px-3 py-1 text-sm font-bold text-[rgb(var(--brand-primary))] border border-[rgb(var(--brand-primary)/0.2)]">
              {t("catalog.exploreLabel", "Nuevas oportunidades")}
            </span>
            <h1 className="text-4xl font-black tracking-tight text-[rgb(var(--text-primary))] sm:text-5xl md:text-6xl lg:text-7xl">
              {t("catalog.title", "Explora Cursos")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium text-[rgb(var(--text-secondary))] md:text-xl">
              {t(
                "catalog.subtitle",
                "Descubre contenido de clase mundial para llevar tu carrera al siguiente nivel.",
              )}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-10 max-w-7xl px-4 md:px-6">
        {/* Glassmorphism Toolbar */}
        <div className="mb-12 flex flex-col gap-4 rounded-2xl border border-[rgb(var(--border-base)/0.5)] bg-[rgb(var(--bg-surface)/0.6)] p-3 backdrop-blur-xl shadow-2xl sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
            <input
              type="text"
              placeholder={t("catalog.searchPlaceholder", "Buscar cursos...")}
              value={filters.search}
              onChange={(e) =>
                updateFilters({ ...filters, search: e.target.value })
              }
              className="w-full rounded-xl border-0 bg-transparent py-4 pl-12 pr-4 text-base font-medium outline-none placeholder:text-[rgb(var(--text-muted))] transition focus:ring-0"
            />
          </div>
          <div className="flex items-center gap-2 px-2">
            <Button
              variant="secondary"
              className="lg:hidden"
              onClick={() => setShowMobileFilters(true)}
            >
              <Filter className="mr-2 h-4 w-4" /> Filtros
            </Button>
            <div className="hidden h-8 w-px bg-[rgb(var(--border-base)/0.5)] lg:block" />
            <span className="hidden whitespace-nowrap text-sm font-bold text-[rgb(var(--text-secondary))] lg:block">
              {totalCourses} {t("catalog.results", "cursos encontrados")}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <CatalogFilters
              filters={filters}
              onChange={updateFilters}
              categories={categories}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Loading State */}
            {loading ? (
              <LoadingContent />
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
                      <div className="mt-12 flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          disabled={page === 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className="hover:bg-[rgb(var(--brand-primary)/0.1)] hover:text-[rgb(var(--brand-primary))]"
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          {t("common.previous", "Anterior")}
                        </Button>
                        <div className="flex items-center gap-1 mx-4">
                          <span className="text-sm font-bold text-[rgb(var(--text-primary))]">
                            {page}
                          </span>
                          <span className="text-sm text-[rgb(var(--text-secondary))]">
                            / {totalPages}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          disabled={page === totalPages}
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          className="hover:bg-[rgb(var(--brand-primary)/0.1)] hover:text-[rgb(var(--brand-primary))]"
                        >
                          {t("common.next", "Siguiente")}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl bg-[rgb(var(--bg-surface))] p-12 text-center border border-[rgb(var(--border-base))] shadow-sm mt-4">
                    <div className="mb-6 rounded-2xl bg-[rgb(var(--brand-primary)/0.05)] p-5 text-[rgb(var(--brand-primary))]">
                      <Search className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black text-[rgb(var(--text-primary))]">
                      {t("catalog.noCoursesFound", "No se encontraron cursos")}
                    </h3>
                    <p className="mt-3 max-w-sm text-[rgb(var(--text-secondary))]">
                      {t(
                        "catalog.noResultsDesc",
                        "Intenta ajustar tus filtros o búsqueda para encontrar lo que necesitas.",
                      )}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-8 border-[rgb(var(--brand-primary))] text-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary))] hover:text-white"
                      onClick={() =>
                        updateFilters({
                          search: "",
                          categories: [],
                          levels: [],
                          myCoursesOnly: false,
                        })
                      }
                    >
                      {t("catalog.clearFilters", "Limpiar filtros")}
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
            onChange={updateFilters}
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
