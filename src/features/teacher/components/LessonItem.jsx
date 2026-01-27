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
  File,
  Settings,
} from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { FileService } from "../../../shared/data/files";

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
export function LessonItem({
  lesson,
  onEdit,
  onDelete,
  onPreview,
  onConfigure, // New prop
  isDragging = false,
  dragHandleProps,
}) {
  const { t } = useTranslation();
  const Icon = getLessonIcon(lesson.kind);
  const colorClasses = getLessonTypeClasses(lesson.kind);

  // Check for attachments (new array format or old JSON)
  const hasAttachments = React.useMemo(() => {
    if (lesson.attachments && lesson.attachments.length > 0) return true;
    if (lesson.attachmentsJson) {
      try {
        const parsed = JSON.parse(lesson.attachmentsJson);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    }
    return false;
  }, [lesson]);

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get thumbnail URL if available
  const coverUrl = React.useMemo(() => {
    if (lesson.videoCoverFileId) {
      return FileService.getCourseCoverUrl(lesson.videoCoverFileId, {
        width: 100,
        height: 100,
        quality: 60,
      }); // Using course cover bucket for now
    }
    return null;
  }, [lesson.videoCoverFileId]);

  return (
    <div
      className={`flex items-center justify-between rounded-lg border border-[rgb(var(--border-base))] py-2 px-3 transition hover:border-[rgb(var(--brand-primary))] ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Drag handle */}
        <div className="cursor-grab touch-none p-1" {...dragHandleProps}>
          <GripVertical className="h-4 w-4 text-[rgb(var(--text-muted))]" />
        </div>

        {/* Thumbnail or Type icon */}
        {coverUrl ? (
          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-black">
            <img
              src={coverUrl}
              alt={lesson.title}
              className="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="h-4 w-4 text-white drop-shadow-md" />
            </div>
          </div>
        ) : (
          <div className={`p-1.5 rounded-md shrink-0 ${colorClasses}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}

        {/* Title & Meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate block">
              {lesson.title}
            </span>
            {hasAttachments && (
              <File
                className="h-3.5 w-3.5 text-[rgb(var(--text-muted))]"
                title={t("teacher.lesson.hasAttachments") || "Tiene adjuntos"}
              />
            )}
            {lesson.isFreePreview && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                FREE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-secondary))]">
            {lesson.durationSec > 0 && (
              <span>{formatDuration(lesson.durationSec)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {(lesson.kind === "quiz" || lesson.kind === "assignment") && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onConfigure?.(lesson)}
            className="h-8 w-8 text-[rgb(var(--text-secondary))]"
            title={
              lesson.kind === "quiz"
                ? t("teacher.quiz.configure") || "Configurar"
                : t("teacher.assignment.configure") || "Configurar"
            }
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        )}
        {lesson.kind === "video" && lesson.videoFileId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPreview?.(lesson)}
            className="h-8 w-8 text-[rgb(var(--brand-primary))]"
            title={t("teacher.lesson.preview") || "Vista previa"}
          >
            <Video className="h-3.5 w-3.5" />
          </Button>
        )}
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
