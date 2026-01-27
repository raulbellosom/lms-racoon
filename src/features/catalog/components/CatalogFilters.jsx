import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthProvider";
import { Search } from "lucide-react";

export function CatalogFilters({
  filters,
  onChange,
  categories = [],
  className = "",
}) {
  const { t } = useTranslation();
  const { auth } = useAuth();
  const isTeacherOrAdmin =
    auth.user &&
    (auth.profile?.role === "teacher" || auth.profile?.role === "admin");

  const handleCategoryChange = (catId) => {
    const newCategories = filters.categories.includes(catId)
      ? filters.categories.filter((id) => id !== catId)
      : [...filters.categories, catId];
    onChange({ ...filters, categories: newCategories });
  };

  const handleLevelChange = (level) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter((l) => l !== level)
      : [...filters.levels, level];
    onChange({ ...filters, levels: newLevels });
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Search - Mobile only (desktop has it in header usually, or top of grid) */}
      <div className="relative md:hidden">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
        <input
          type="text"
          placeholder={t("catalog.searchPlaceholder", "Buscar cursos...")}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-card))] py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[rgb(var(--brand-primary))] focus:ring-2 focus:ring-[rgb(var(--brand-primary))/0.2]"
        />
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
          {t("catalog.categories", "Categorías")}
        </h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label
              key={cat.$id}
              className="flex cursor-pointer items-center gap-3 group"
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  filters.categories.includes(cat.$id)
                    ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))]"
                    : "border-[rgb(var(--border-input))] bg-[rgb(var(--bg-input))] group-hover:border-[rgb(var(--brand-primary))]"
                }`}
              >
                {filters.categories.includes(cat.$id) && (
                  <svg
                    className="h-3.5 w-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={filters.categories.includes(cat.$id)}
                onChange={() => handleCategoryChange(cat.$id)}
              />
              <span className="text-sm font-medium text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--text-primary))] transition-colors">
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Levels */}
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
          {t("catalog.levels", "Niveles")}
        </h3>
        <div className="space-y-2">
          {["beginner", "intermediate", "advanced"].map((level) => (
            <label
              key={level}
              className="flex cursor-pointer items-center gap-3 group"
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  filters.levels.includes(level)
                    ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))]"
                    : "border-[rgb(var(--border-input))] bg-[rgb(var(--bg-input))] group-hover:border-[rgb(var(--brand-primary))]"
                }`}
              >
                {filters.levels.includes(level) && (
                  <svg
                    className="h-3.5 w-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={filters.levels.includes(level)}
                onChange={() => handleLevelChange(level)}
              />
              <span className="text-sm font-medium text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--text-primary))] transition-colors">
                {t(`courses.levels.${level}`, level)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Teacher Filter */}
      {isTeacherOrAdmin && (
        <label className="flex cursor-pointer items-center gap-3 group">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
              filters.myCoursesOnly
                ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))]"
                : "border-[rgb(var(--border-input))] bg-[rgb(var(--bg-input))] group-hover:border-[rgb(var(--brand-primary))]"
            }`}
          >
            {filters.myCoursesOnly && (
              <svg
                className="h-3.5 w-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <input
            type="checkbox"
            className="hidden"
            checked={filters.myCoursesOnly || false}
            onChange={(e) =>
              onChange({ ...filters, myCoursesOnly: e.target.checked })
            }
          />
          <span className="text-sm font-medium text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--text-primary))] transition-colors">
            {t("catalog.myCourses", "Ver mis cursos")}
          </span>
        </label>
      )}
    </div>
  );
}
