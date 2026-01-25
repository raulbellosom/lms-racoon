import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Textarea } from "../../../shared/ui/Textarea";

/**
 * CourseBasicInfoForm - Form for course title, subtitle, description, category, level, language
 * @param {Object} formData - Form state object
 * @param {Function} setFormData - State setter function
 * @param {Array} categories - List of category options
 */
const CharCounter = ({ current, max }) => {
  const percentage = Math.min((current / max) * 100, 100);
  const isNear = percentage > 90;
  const isOver = current > max;
  const remaining = max - current;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium transition-all">
      <span
        className={
          isOver
            ? "text-red-500 font-bold"
            : isNear
              ? "text-amber-500"
              : "text-[rgb(var(--text-muted))]"
        }
      >
        {remaining}
      </span>
      <div className="relative h-4 w-4">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
          {/* Background Circle */}
          <path
            className="text-[rgb(var(--bg-muted))]"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
          {/* Progress Circle */}
          <path
            className={
              isOver
                ? "text-red-500"
                : isNear
                  ? "text-amber-500"
                  : "text-[rgb(var(--brand-primary))]"
            }
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
        </svg>
      </div>
    </div>
  );
};

export function CourseBasicInfoForm({
  formData,
  setFormData,
  categories = [],
  errors = {},
}) {
  const { t } = useTranslation();

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* General Information Card */}
      <Card className="p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-bold">
          {t("teacher.form.generalInfo")}
        </h3>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-semibold text-[rgb(var(--text-secondary))]">
                {t("teacher.courseTitle")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <CharCounter current={formData.title.length} max={120} />
            </div>
            <Input
              placeholder={t("teacher.form.courseTitlePlaceholder")}
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              className={
                errors.title || formData.title.length > 120
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
            {formData.title.length > 120 && (
              <p className="mt-1 text-xs text-red-500">
                El título no puede exceder los 120 caracteres.
              </p>
            )}
          </div>

          {/* Subtitle */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-semibold text-[rgb(var(--text-secondary))]">
                {t("teacher.courseSubtitle")}
              </label>
              <CharCounter current={formData.subtitle.length} max={180} />
            </div>
            <Input
              placeholder={t("teacher.form.subtitlePlaceholder")}
              value={formData.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
              className={formData.subtitle.length > 180 ? "border-red-500" : ""}
            />
            {formData.subtitle.length > 180 && (
              <p className="mt-1 text-xs text-red-500">
                El subtítulo no puede exceder los 180 caracteres.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Classification Card */}
      <Card className="p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-bold">
          {t("teacher.form.classification")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.category")} <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full h-10 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-[rgb(var(--brand-primary))] ${
                errors.categoryId ? "border-red-500 focus:ring-red-500" : ""
              }`}
              value={formData.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
            >
              <option value="">{t("teacher.form.selectCategory")}</option>
              {categories.map((cat) => (
                <option key={cat.$id} value={cat.$id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>
            )}
          </div>

          {/* Level */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.form.level")}
            </label>
            <select
              className="w-full h-10 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 text-sm"
              value={formData.level}
              onChange={(e) => updateField("level", e.target.value)}
            >
              <option value="beginner">{t("courses.levels.beginner")}</option>
              <option value="intermediate">
                {t("courses.levels.intermediate")}
              </option>
              <option value="advanced">{t("courses.levels.advanced")}</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.form.language")}
            </label>
            <select
              className="w-full h-10 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 text-sm"
              value={formData.language}
              onChange={(e) => updateField("language", e.target.value)}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}
