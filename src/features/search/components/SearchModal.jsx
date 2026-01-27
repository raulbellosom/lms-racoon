import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  ArrowLeft,
  Search,
  Loader2,
  BookOpen,
  PlayCircle,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import { Badge } from "../../../shared/ui/Badge";
import { ProfileService } from "../../../shared/data/profiles";
import { FileService } from "../../../shared/data/files";
import { Avatar } from "../../../shared/ui/Avatar";
import { cn } from "../../../shared/ui/cn";

export function SearchModal({ open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const { query, setQuery, results, isLoading, clearSearch } =
    useGlobalSearch();

  // Prevent body scroll when open and focus input
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // Small timeout to allow animation to start/render
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const hasResults =
    results.courses.length > 0 ||
    results.teachers.length > 0 ||
    results.lessons.length > 0;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          />

          {/* Modal Content - Full screen-ish or sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-[25%] z-[70] flex flex-col rounded-t-3xl bg-[rgb(var(--bg-surface))] shadow-2xl md:hidden overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[rgb(var(--border-base))] p-4 pt-safe-top">
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-[rgb(var(--bg-muted))]"
              >
                <ArrowLeft className="h-6 w-6 text-[rgb(var(--text-primary))]" />
              </button>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-secondary))]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("common.searchCourses", "Buscar cursos...")}
                  className="w-full rounded-xl border-none bg-[rgb(var(--bg-muted))] py-2.5 pl-10 pr-10 text-base font-medium outline-none placeholder:text-[rgb(var(--text-secondary))] focus:ring-2 focus:ring-[rgb(var(--brand-primary)/0.2)]"
                />
                {query && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5"
                  >
                    <X className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
                  </button>
                )}
              </div>
            </div>

            {/* Loading Bar */}
            {isLoading && (
              <div className="h-1 w-full overflow-hidden bg-[rgb(var(--bg-muted))]">
                <div className="h-full w-1/3 animate-indeterminate bg-[rgb(var(--brand-primary))]" />
              </div>
            )}

            {/* Results Body */}
            <div className="flex-1 overflow-y-auto p-4 pb-safe-bottom">
              {!query && (
                <div className="flex h-full flex-col items-center justify-center text-center text-[rgb(var(--text-tertiary))]">
                  <Search className="mb-4 h-12 w-12 opacity-20" />
                  <p>{t("search.startTyping", "Escribe para buscar...")}</p>
                </div>
              )}

              {query && !hasResults && !isLoading && (
                <div className="flex h-full flex-col items-center justify-center text-center text-[rgb(var(--text-secondary))]">
                  <p>
                    {t("catalog.noCourses", "No se encontraron resultados")}
                  </p>
                </div>
              )}

              {hasResults && (
                <div className="space-y-6">
                  {/* Courses */}
                  {results.courses.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
                        {t("nav.courses", "Cursos")}
                      </h3>
                      {results.courses.map((course) => (
                        <button
                          key={course.$id}
                          onClick={() =>
                            handleNavigate(`/app/courses/${course.$id}`)
                          }
                          className="flex w-full items-start gap-4 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-base))] p-3 text-left shadow-sm transition-all active:scale-[0.98]"
                        >
                          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[rgb(var(--bg-muted))]">
                            {course.coverUrl || course.coverFileId ? (
                              <img
                                src={
                                  course.coverUrl ||
                                  FileService.getCourseCoverUrl(
                                    course.coverFileId,
                                  )
                                }
                                alt={course.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <BookOpen className="h-6 w-6 text-[rgb(var(--text-secondary))]" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[rgb(var(--text-primary))] line-clamp-2 leading-tight">
                              {course.title}
                            </h4>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge
                                variant="secondary"
                                className="text-[10px] h-5 px-1.5"
                              >
                                {t(
                                  `courses.levels.${course.level}`,
                                  course.level,
                                )}
                              </Badge>
                              <Badge
                                variant={
                                  course.priceCents === 0 ? "success" : "brand"
                                }
                                className="text-[10px] h-5 px-1.5"
                              >
                                {course.priceCents === 0
                                  ? "Gratis"
                                  : `$${(course.priceCents / 100).toFixed(2)}`}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          handleNavigate(`/app/explore?q=${query}`)
                        }
                        className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-[rgb(var(--brand-primary))]"
                      >
                        Ver todos los resultados{" "}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Teachers */}
                  {results.teachers.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
                        {t("nav.instructors", "Instructores")}
                      </h3>
                      {results.teachers.map((teacher) => (
                        <button
                          key={teacher.$id}
                          onClick={() =>
                            handleNavigate(
                              `/app/explore?teacherId=${teacher.$id}`,
                            )
                          }
                          className="flex w-full items-center gap-4 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-base))] p-3 text-left shadow-sm active:scale-[0.98]"
                        >
                          <Avatar
                            name={`${teacher.firstName} ${teacher.lastName}`}
                            src={ProfileService.getAvatarUrl(
                              teacher.avatarFileId,
                            )}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[rgb(var(--text-primary))]">
                              {teacher.firstName} {teacher.lastName}
                            </div>
                            <div className="text-sm text-[rgb(var(--text-secondary))] truncate">
                              {teacher.headline || t("roles.teacher")}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-[rgb(var(--text-muted))]" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Lessons */}
                  {results.lessons.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
                        Lecciones
                      </h3>
                      {results.lessons.map((lesson) => (
                        <button
                          key={lesson.$id}
                          onClick={() =>
                            handleNavigate(
                              `/app/learn/${lesson.courseId}/${lesson.$id}`,
                            )
                          }
                          className="flex w-full items-center gap-4 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-base))] p-3 text-left shadow-sm active:scale-[0.98]"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--brand-primary)/0.1)] text-[rgb(var(--brand-primary))]">
                            <PlayCircle className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[rgb(var(--text-primary))] line-clamp-2">
                              {lesson.title}
                            </div>
                            <div className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">
                              Ver lección
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* View All Sticky Button if needed or Footer */}
            {hasResults && (
              <div className="border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] p-4 pb-safe-bottom">
                <button
                  onClick={() => handleNavigate(`/app/explore?q=${query}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--brand-primary))] py-3.5 text-base font-bold text-white shadow-lg shadow-[rgb(var(--brand-primary)/0.2)] active:scale-[0.98] transition-transform"
                >
                  <Search className="h-5 w-5" />
                  Ver todos los resultados (
                  {results.courses.length +
                    results.teachers.length +
                    results.lessons.length}
                  )
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
