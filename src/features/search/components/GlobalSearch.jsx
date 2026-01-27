import React, { useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  BookOpen,
  User,
  PlayCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import { cn } from "../../../shared/ui/cn";
import { Avatar } from "../../../shared/ui/Avatar";
import { ProfileService } from "../../../shared/data/profiles";
import { FileService } from "../../../shared/data/files";
import { Badge } from "../../../shared/ui/Badge";

export function GlobalSearch({ className }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const {
    query,
    setQuery,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    clearSearch,
  } = useGlobalSearch();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  // Open dropdown when query exists
  useEffect(() => {
    if (query.length >= 2 && !isOpen) {
      setIsOpen(true);
    }
  }, [query]);

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const hasResults =
    results.courses.length > 0 ||
    results.teachers.length > 0 ||
    results.lessons.length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-96", className)}>
      <div
        className={cn(
          "flex items-center gap-2 border bg-[rgb(var(--bg-base))] px-3 py-2 transition-all duration-200 relative z-51",
          isOpen
            ? "rounded-t-2xl rounded-b-none border-[rgb(var(--border-base))] border-b-0"
            : "rounded-2xl border-[rgb(var(--border-base))] hover:border-[rgb(var(--text-secondary))]",
        )}
      >
        <Search className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={t("common.searchCourses", "Buscar cursos...")}
          className="flex-1 border-none! bg-transparent! text-sm placeholder-[rgb(var(--text-secondary))] outline-none! shadow-none! ring-0! focus:ring-0! focus:outline-none! focus:border-none! focus-visible:ring-0! focus-visible:outline-none! focus-visible:border-none!"
        />
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[rgb(var(--brand-primary))]" />
        ) : query ? (
          <button
            onClick={clearSearch}
            className="rounded-full p-0.5 hover:bg-[rgb(var(--bg-muted))]"
          >
            <X className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 overflow-hidden rounded-b-2xl rounded-t-none border border-t-0 border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] shadow-xl -mt-px"
          >
            <div className="max-h-[70vh] overflow-y-auto p-2 scrollbar-thin">
              {!hasResults && !isLoading && (
                <div className="py-8 text-center">
                  <p className="text-sm text-[rgb(var(--text-secondary))]">
                    {t("catalog.noCourses", "No se encontraron resultados")}
                  </p>
                </div>
              )}

              {/* Courses Section */}
              {results.courses.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
                    {t("nav.courses", "Cursos")}
                  </div>
                  {results.courses.map((course) => (
                    <button
                      key={course.$id}
                      onClick={() =>
                        handleNavigate(`/app/courses/${course.$id}`)
                      }
                      className="flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-[rgb(var(--bg-muted))] transition-colors"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md overflow-hidden bg-[rgb(var(--bg-muted))]">
                        {course.coverUrl || course.coverFileId ? (
                          <img
                            src={
                              course.coverUrl ||
                              FileService.getCourseCoverUrl(course.coverFileId)
                            }
                            alt={course.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-5 w-5 text-[rgb(var(--text-secondary))]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">
                          {course.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge
                            variant="default"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {t(`courses.levels.${course.level}`, course.level)}
                          </Badge>
                          {course.priceCents === 0 ? (
                            <Badge
                              variant="success"
                              className="text-[10px] px-1.5 py-0"
                            >
                              Gratis
                            </Badge>
                          ) : (
                            <Badge
                              variant="brand"
                              className="text-[10px] px-1.5 py-0"
                            >
                              ${(course.priceCents / 100).toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  <div className="mt-1 px-2">
                    <Link
                      to={`/app/explore?q=${query}`}
                      className="text-xs font-medium text-[rgb(var(--brand-primary))] hover:underline flex items-center gap-1"
                    >
                      Ver más cursos <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Teachers Section */}
              {results.teachers.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
                    {t("nav.instructors", "Instructores")}
                  </div>
                  {results.teachers.map((teacher) => (
                    <button
                      key={teacher.$id}
                      onClick={() =>
                        handleNavigate(`/app/explore?teacherId=${teacher.$id}`)
                      }
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-[rgb(var(--bg-muted))] transition-colors"
                    >
                      <Avatar
                        name={`${teacher.firstName} ${teacher.lastName}`}
                        src={ProfileService.getAvatarUrl(teacher.avatarFileId)}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">
                          {teacher.firstName} {teacher.lastName}
                        </div>
                        <div className="text-xs text-[rgb(var(--text-secondary))] truncate">
                          {teacher.headline || t("roles.teacher")}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Lessons Section - Placeholder if implemented in service */}
              {results.lessons.length > 0 && (
                <div>
                  <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
                    Lecciones
                  </div>
                  {results.lessons.map((lesson) => (
                    <button
                      key={lesson.$id}
                      onClick={() =>
                        handleNavigate(
                          `/app/learn/${lesson.courseId}/${lesson.$id}`,
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-[rgb(var(--bg-muted))] transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--success)/0.1)] text-[rgb(var(--success))]">
                        <PlayCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-[rgb(var(--text-primary))] truncate">
                          {lesson.title}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted)/0.5)] p-2">
              <button
                onClick={() => handleNavigate(`/app/explore?q=${query}`)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--bg-surface))] py-2 text-xs font-medium text-[rgb(var(--text-primary))] shadow-sm border border-[rgb(var(--border-base))] hover:bg-[rgb(var(--bg-muted))]"
              >
                <Search className="h-3 w-3" />
                Ver todos los resultados para "{query}"
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
