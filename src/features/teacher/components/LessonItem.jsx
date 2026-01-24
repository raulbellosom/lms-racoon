import React from "react";
import { useTranslation } from "react-i18next";
import {
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  X,
  GripVertical,
  Edit2,
} from "lucide-react";
import { Button } from "../../../shared/ui/Button";

/**
 * Get icon for lesson type
 */
const getLessonIcon = (kind) => {
  switch (kind) {
    case "video":
      return Video;
    case "article":
      return FileText;
    case "quiz":
      return HelpCircle;
    case "assignment":
      return ClipboardList;
    default:
      return FileText;
  }
};

/**
 * Get color classes for lesson type
 */
const getLessonTypeClasses = (kind) => {
  switch (kind) {
    case "video":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
    case "article":
      return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400";
    case "quiz":
      return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
    case "assignment":
      return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
};

/**
 * LessonItem - Single lesson row in curriculum
 * @param {Object} lesson - Lesson data
 * @param {Function} onEdit - Edit callback
 * @param {Function} onDelete - Delete callback
 * @param {boolean} isDragging - Is currently being dragged
 */
export function LessonItem({ lesson, onEdit, onDelete, isDragging = false }) {
  const { t } = useTranslation();
  const Icon = getLessonIcon(lesson.kind);
  const colorClasses = getLessonTypeClasses(lesson.kind);

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex items-center justify-between rounded-lg border border-[rgb(var(--border-base))] py-2 px-3 transition hover:border-[rgb(var(--brand-primary))] ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Drag handle */}
        <div className="cursor-grab touch-none">
          <GripVertical className="h-4 w-4 text-[rgb(var(--text-muted))]" />
        </div>

        {/* Type icon */}
        <div className={`p-1.5 rounded-md flex-shrink-0 ${colorClasses}`}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Title */}
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium truncate block">
            {lesson.title}
          </span>
          {lesson.durationSec > 0 && (
            <span className="text-xs text-[rgb(var(--text-secondary))]">
              {formatDuration(lesson.durationSec)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit?.(lesson)}
          className="h-8 w-8"
        >
          <Edit2 className="h-3.5 w-3.5 text-[rgb(var(--text-muted))]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete?.(lesson)}
          className="h-8 w-8"
        >
          <X className="h-3.5 w-3.5 text-[rgb(var(--text-muted))]" />
        </Button>
      </div>
    </div>
  );
}
