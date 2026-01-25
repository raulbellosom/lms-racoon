import React from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { SectionCard } from "./SectionCard";

/**
 * CurriculumEditor - Full curriculum management for sections and lessons
 * @param {Array} sections - List of sections
 * @param {Object} lessonsBySection - Map of sectionId -> lessons array
 * @param {Function} onAddSection - Add section callback
 * @param {Function} onEditSection - Edit section callback
 * @param {Function} onDeleteSection - Delete section callback
 * @param {Function} onAddLesson - Add lesson callback
 * @param {Function} onEditLesson - Edit lesson callback
 * @param {Function} onDeleteLesson - Delete lesson callback
 */
export function CurriculumEditor({
  sections = [],
  lessonsBySection = {},
  onAddSection,
  onEditSection,
  onDeleteSection,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  ...props
}) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{t("teacher.curriculum.title")}</h3>
        <Button onClick={onAddSection} size="sm" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> {t("teacher.addSection")}
        </Button>
      </div>

      {/* Sections list or empty state */}
      {sections.length === 0 ? (
        <Card className="p-8 text-center text-[rgb(var(--text-secondary))]">
          {t("teacher.curriculum.noSections")}
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <SectionCard
              key={section.$id}
              section={section}
              index={index}
              lessons={lessonsBySection[section.$id] || []}
              onEditSection={onEditSection}
              onDeleteSection={onDeleteSection}
              onAddLesson={onAddLesson}
              onEditLesson={onEditLesson}
              onDeleteLesson={onDeleteLesson}
              onPreviewLesson={props.onPreviewLesson}
            />
          ))}
        </div>
      )}
    </div>
  );
}
