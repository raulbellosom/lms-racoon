import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, Trash2, Edit2, Plus } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { LessonItem } from "./LessonItem";

/**
 * SectionCard - Collapsible section with its lessons
 * @param {Object} section - Section data
 * @param {number} index - Section index (for display)
 * @param {Array} lessons - Lessons in this section
 * @param {Function} onEditSection - Edit section callback
 * @param {Function} onDeleteSection - Delete section callback
 * @param {Function} onAddLesson - Add lesson callback
 * @param {Function} onEditLesson - Edit lesson callback
 * @param {Function} onDeleteLesson - Delete lesson callback
 */
export function SectionCard({
  section,
  index,
  lessons = [],
  onEditSection,
  onDeleteSection,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(true);

  return (
    <div className="rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] overflow-hidden">
      {/* Section Header */}
      <div
        className="flex items-center justify-between bg-[rgb(var(--bg-muted))] px-3 sm:px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Expand/collapse icon */}
          <button className="p-1 rounded hover:bg-[rgb(var(--bg-surface))] transition-colors flex-shrink-0">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
            )}
          </button>

          {/* Section number */}
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--bg-surface))] text-xs font-bold text-[rgb(var(--text-secondary))] flex-shrink-0">
            {index + 1}
          </div>

          {/* Title */}
          <span className="font-bold text-[rgb(var(--text-primary))] truncate text-sm sm:text-base">
            {section.title}
          </span>

          {/* Lessons count badge */}
          <span className="text-xs text-[rgb(var(--text-secondary))] flex-shrink-0">
            ({lessons.length} {t("courses.lessons")})
          </span>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEditSection?.(section)}
            className="h-8 w-8"
            title={t("teacher.curriculum.editSection")}
          >
            <Edit2 className="h-4 w-4 text-[rgb(var(--text-muted))]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteSection?.(section)}
            className="h-8 w-8 text-red-500 hover:text-red-600"
            title={t("teacher.curriculum.deleteSection")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Section Content - Lessons */}
      {expanded && (
        <div className="p-3 sm:p-4 bg-[rgb(var(--bg-surface))]">
          {/* Lessons list */}
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <LessonItem
                key={lesson.$id}
                lesson={lesson}
                onEdit={onEditLesson}
                onDelete={onDeleteLesson}
              />
            ))}
          </div>

          {/* Add Lesson Button */}
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 w-full border-dashed border-2 border-[rgb(var(--border-base))] bg-transparent hover:bg-[rgb(var(--bg-muted))]"
            onClick={() => onAddLesson?.(section)}
          >
            <Plus className="mr-2 h-4 w-4" /> {t("teacher.addLesson")}
          </Button>
        </div>
      )}
    </div>
  );
}
