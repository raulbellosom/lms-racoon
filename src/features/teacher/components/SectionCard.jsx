// Imports updated to remove DndContext hooks if unused
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  Plus,
  GripVertical,
} from "lucide-react";
// Remove DndContext imports if not used, keep Sortable imports
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "../../../shared/ui/Button";
import { LessonItem } from "./LessonItem";

/**
 * SortableLessonItem - Wrapper for LessonItem to make it sortable
 */
function SortableLessonItem({ lesson, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.$id, data: { type: "LESSON", lesson } }); // Added data type

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <LessonItem
        lesson={lesson}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...props}
      />
    </div>
  );
}

/**
 * SectionCard - Collapsible section with its lessons
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
  onReorderLessons, // Passed but unused for drag event now, parent handles it
  dragHandleProps, // Props for dragging the section itself
  ...props
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(true);

  // No internal DndContext or sensors needed

  return (
    <div className="rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] overflow-hidden">
      {/* Section Header */}
      <div
        className="flex items-center justify-between bg-[rgb(var(--bg-muted))] px-3 sm:px-4 py-3 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Drag Handle for Section */}
          <div
            className="cursor-move p-1 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
            onClick={(e) => e.stopPropagation()}
            {...dragHandleProps}
          >
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Expand/collapse icon */}
          <button className="p-1 rounded hover:bg-[rgb(var(--bg-surface))] transition-colors shrink-0">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
            ) : (
              <ChevronRight className="h-4 w-4 text-[rgb(var(--text-secondary))]" />
            )}
          </button>

          {/* Section number */}
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--bg-surface))] text-xs font-bold text-[rgb(var(--text-secondary))] shrink-0">
            {index + 1}
          </div>

          {/* Title */}
          <span className="font-bold text-[rgb(var(--text-primary))] truncate text-sm sm:text-base">
            {section.title}
          </span>

          {/* Lessons count badge */}
          <span className="text-xs text-[rgb(var(--text-secondary))] shrink-0">
            ({lessons.length} {t("courses.lessons")})
          </span>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-1 shrink-0"
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
            <SortableContext
              items={lessons.map((l) => l.$id)}
              strategy={verticalListSortingStrategy}
            >
              {lessons.map((lesson) => (
                <SortableLessonItem
                  key={lesson.$id}
                  lesson={lesson}
                  onEdit={onEditLesson}
                  onDelete={onDeleteLesson}
                  onPreview={props.onPreviewLesson}
                />
              ))}
            </SortableContext>

            {/* Placeholder/Empty State for empty sections to allow dropping */}
            {lessons.length === 0 && (
              <div className="text-sm text-center py-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                Arrastra lecciones aquí
              </div>
            )}
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
