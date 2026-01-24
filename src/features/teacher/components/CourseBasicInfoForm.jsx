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
export function CourseBasicInfoForm({
  formData,
  setFormData,
  categories = [],
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
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.courseTitle")} <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder={t("teacher.form.courseTitlePlaceholder")}
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.courseSubtitle")}
            </label>
            <Input
              placeholder={t("teacher.form.subtitlePlaceholder")}
              value={formData.subtitle}
              onChange={(e) => updateField("subtitle", e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.courseDescription")}
            </label>
            <Textarea
              placeholder={t("teacher.form.descriptionPlaceholder")}
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={6}
            />
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
              className="w-full h-10 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-[rgb(var(--brand-primary))]"
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
