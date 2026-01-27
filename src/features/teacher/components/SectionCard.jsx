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
  Eye,
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
  onMakeSectionFree, // New prop
  onReorderLessons, // Passed but unused for drag event now, parent handles it
  dragHandleProps, // Props for dragging the section itself
  ...props
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(true);
  const [cooldown, setCooldown] = React.useState(0);
  const [showTooltip, setShowTooltip] = React.useState(false);

  React.useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleMakeFreeClick = (e) => {
    e.stopPropagation();
    if (cooldown > 0) return;

    // Desktop: Hover/Click logic can be tricky, so let's stick to click for action + confirmation modal.
    // User wants "better tooltip and responsive without hover".
    // On mobile, tapping the button could show tooltip first?
    // Or just show tooltip on click?
    // Let's toggle tooltip on click if not visible, and if visible execute action?
    // OR: Just show tooltip always on hover (desktop) and rely on Modal for confirmation (mobile/desktop).
    // Requirement: "indicate that with the green button the eye means that the whole section will be free".
    // AND "timeout of 5 to use that button again".

    onMakeSectionFree?.(section);
    setCooldown(5); // Start cooldown
  };

  // No internal DndContext or sensors needed

  return (
    <div className="rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]">
      {/* Section Header */}
      <div
        className={`flex items-center justify-between bg-[rgb(var(--bg-muted))] px-3 sm:px-4 py-3 cursor-pointer group rounded-t-xl ${!expanded ? "rounded-b-xl" : ""}`}
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
          <div className="relative group/tooltip">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMakeFreeClick}
              disabled={cooldown > 0}
              className={`h-8 w-8 relative ${
                cooldown > 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
              }`}
            >
              {cooldown > 0 ? (
                <span className="text-xs font-bold">{cooldown}s</span>
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>

            {/* Custom Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/90 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 text-center">
              {t("teacher.lesson.makeSectionFreeDesc") ||
                "Hacer gratuita toda la sección"}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90" />
            </div>
          </div>
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
        <div className="p-3 sm:p-4 bg-[rgb(var(--bg-surface))] rounded-b-xl">
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
