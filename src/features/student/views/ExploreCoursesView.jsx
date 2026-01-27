import React from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingContent } from "../../../shared/ui/LoadingScreen";

import { CatalogFilters } from "../../catalog/components/CatalogFilters";
import { CourseCard } from "../../../components/courses/CourseCard";
import { Drawer } from "../../../shared/ui/Drawer";
import { Button } from "../../../shared/ui/Button";
import { listPublishedCourses } from "../../../shared/data/courses";
import { CategoryService } from "../../../shared/data/categories";

export function ExploreCoursesView() {
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
      teacherId: searchParams.get("teacherId") || "",
      priceMin: searchParams.get("priceMin") || null,
      priceMax: searchParams.get("priceMax") || null,
      isFree: searchParams.get("isFree"), // "true", "false", or null
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
    if (newFilters.teacherId) params.set("teacherId", newFilters.teacherId);
    if (newFilters.priceMin) params.set("priceMin", newFilters.priceMin);
    if (newFilters.priceMax) params.set("priceMax", newFilters.priceMax);
    if (newFilters.isFree !== null && newFilters.isFree !== undefined)
      params.set("isFree", newFilters.isFree);

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
        const categoryId =
          filters.categories.length > 0 ? filters.categories[0] : "";

        let teacherId = "";
        let excludeTeacherId = "";

        // If user is teacher/admin:
        // - if myCoursesOnly is TRUE -> Show ONLY my courses (teacherId = me)
        // - if myCoursesOnly is FALSE -> Show all EXCEPT my courses (excludeTeacherId = me)
        // If explicit teacher filter overrides everything
        if (filters.teacherId) {
          teacherId = filters.teacherId;
          // Reset exclude if we are explicitly looking for a teacher (even if it is me, though unusual flow)
          excludeTeacherId = "";
        } else if (
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
          levels: filters.levels,
          priceMin: filters.priceMin,
          priceMax: filters.priceMax,
          isFree:
            filters.isFree === "true"
              ? true
              : filters.isFree === "false"
                ? false
                : null,
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

    const timeoutId = setTimeout(fetchCourses, 300);
    return () => clearTimeout(timeoutId);
  }, [filters, page, auth.user]);

  // Reset page
  React.useEffect(() => {
    setPage(1);
  }, [filters, auth.user]);

  const totalPages = Math.ceil(totalCourses / LIMIT);

  return (
    <div className="space-y-6">
      {/* Banner Section */}
      <div className="relative overflow-hidden bg-[rgb(var(--bg-surface))] -mt-6 -mx-4 md:-mx-8 pt-8 pb-12 mb-8">
        {/* Background Image / Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000"
            alt="Students learning"
            className="h-full w-full object-cover opacity-40 dark:opacity-30"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-[rgb(var(--bg-base)/0.6)] to-[rgb(var(--bg-base))]" />
        </div>

        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-24 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgb(var(--brand-primary)/0.15),transparent_60%)] blur-3xl" />
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-secondary)/0.1),transparent_70%)] blur-2xl" />
          <div className="absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(var(--brand-accent)/0.05),transparent_70%)] blur-2xl" />
        </div>

        <div className="relative z-10 px-6 py-12 md:px-12 md:py-16 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text-primary))] mb-4">
            {t("catalog.title", "Explorar Cursos")}
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-[rgb(var(--text-secondary))]">
            {t("catalog.subtitle", "Descubre contenido de clase mundial.")}
          </p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-8 lg:flex-row">
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
                    updateFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] py-3 pl-10 pr-4 outline-none transition focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgb(var(--brand-primary))/0.2]"
                />
              </div>
              <Button
                variant="secondary"
                className="lg:hidden"
                onClick={() => setShowMobileFilters(true)}
              >
                <Filter className="mr-2 h-4 w-4" />{" "}
                {t("common.filter", "Filtros")}
              </Button>
            </div>

            {/* Loading State */}
            {loading ? (
              <LoadingContent />
            ) : (
              <>
                {/* Results Grid */}
                {courses.length > 0 ? (
                  <div className="space-y-8">
                    <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
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
                          {t("common.previous", "Anterior")}
                        </Button>
                        <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                          {t("common.page", "Página")} {page}{" "}
                          {t("common.of", "de")} {totalPages}
                        </span>
                        <Button
                          variant="ghost"
                          disabled={page === totalPages}
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                        >
                          {t("common.next", "Siguiente")}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl bg-[rgb(var(--bg-surface))] p-12 text-center border border-[rgb(var(--border-base))] border-dashed">
                    <div className="mb-6 rounded-full bg-[rgb(var(--bg-muted))] p-6 text-[rgb(var(--text-muted))]">
                      <Search className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-[rgb(var(--text-primary))]">
                      {t("catalog.noCourses", "No se encontraron cursos")}
                    </h3>
                    <p className="mt-2 text-[rgb(var(--text-secondary))] max-w-sm mx-auto">
                      {t(
                        "catalog.tryAdjustingFilters",
                        "Intenta ajustar tus filtros o búsqueda.",
                      )}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-8"
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

        {/* Mobile Filters Drawer */}
        <Drawer
          open={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          title={t("catalog.filters", "Filtros")}
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
                {t("catalog.results", { count: courses.length })}
              </Button>
            </div>
          </div>
        </Drawer>
      </div>
    </div>
  );
}
