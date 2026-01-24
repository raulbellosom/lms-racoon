import React from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  Upload,
  Trash2,
  File,
} from "lucide-react";
import { Modal } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";
import { Textarea } from "../../../shared/ui/Textarea";
import { Button } from "../../../shared/ui/Button";
import { FileService } from "../../../shared/data/files";

/**
 * Lesson type options
 */
const LESSON_TYPES = [
  {
    value: "video",
    icon: Video,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    value: "article",
    icon: FileText,
    color:
      "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    value: "quiz",
    icon: HelpCircle,
    color:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    value: "assignment",
    icon: ClipboardList,
    color:
      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
];

/**
 * LessonEditorModal - Modal for creating/editing a lesson
 * @param {boolean} open - Modal open state
 * @param {Function} onClose - Close callback
 * @param {Object} lesson - Lesson data (null for new)
 * @param {Object} section - Parent section
 * @param {string} courseId - Parent course ID
 * @param {Function} onSave - Save callback with lesson data
 */
export function LessonEditorModal({
  open,
  onClose,
  lesson,
  section,
  courseId,
  onSave,
}) {
  const { t } = useTranslation();
  const isNew = !lesson?.$id;

  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    kind: "video",
    videoFileId: "",
    durationSec: 0,
    attachmentsJson: "[]",
  });

  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [videoFile, setVideoFile] = React.useState(null);
  const [attachments, setAttachments] = React.useState([]);

  // Load lesson data when editing
  React.useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || "",
        description: lesson.description || "",
        kind: lesson.kind || "video",
        videoFileId: lesson.videoFileId || "",
        durationSec: lesson.durationSec || 0,
        attachmentsJson: lesson.attachmentsJson || "[]",
      });
      try {
        setAttachments(JSON.parse(lesson.attachmentsJson || "[]"));
      } catch {
        setAttachments([]);
      }
    } else {
      setFormData({
        title: "",
        description: "",
        kind: "video",
        videoFileId: "",
        durationSec: 0,
        attachmentsJson: "[]",
      });
      setAttachments([]);
    }
    setVideoFile(null);
  }, [lesson, open]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle video upload
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      alert(t("teacher.errors.uploadFailed"));
      return;
    }

    setVideoFile(file);
    // Optionally get duration from video metadata
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      updateField("durationSec", Math.round(video.duration));
    };
    video.src = URL.createObjectURL(file);
  };

  // Handle attachment upload
  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const attachment = await FileService.uploadLessonAttachment(file);
      setAttachments((prev) => [...prev, attachment]);
    } catch (error) {
      console.error("Attachment upload failed:", error);
      alert(t("teacher.errors.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  // Remove attachment
  const handleRemoveAttachment = async (attachmentId) => {
    try {
      await FileService.deleteLessonAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (error) {
      console.error("Failed to delete attachment:", error);
    }
  };

  // Save lesson
  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert(t("teacher.form.titleRequired"));
      return;
    }

    setSaving(true);
    try {
      let videoFileId = formData.videoFileId;

      // Upload video if new file selected
      if (videoFile) {
        setUploading(true);
        try {
          // Delete old video if exists
          if (formData.videoFileId) {
            await FileService.deleteLessonVideo(formData.videoFileId);
          }
          videoFileId = await FileService.uploadLessonVideo(videoFile);
        } finally {
          setUploading(false);
        }
      }

      const lessonData = {
        courseId,
        sectionId: section.$id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        kind: formData.kind,
        videoFileId,
        durationSec: formData.durationSec,
        attachmentsJson: JSON.stringify(attachments),
      };

      await onSave?.(lessonData, lesson?.$id);
      onClose();
    } catch (error) {
      console.error("Failed to save lesson:", error);
      alert(t("teacher.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isNew ? t("teacher.lesson.createTitle") : t("teacher.lesson.editTitle")
      }
    >
      <div className="space-y-4">
        {/* Lesson Type Selector */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
            {t("teacher.curriculum.lessonType")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LESSON_TYPES.map(({ value, icon: Icon, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateField("kind", value)}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  formData.kind === value
                    ? `${color} ring-2 ring-[rgb(var(--brand-primary))]`
                    : "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-muted))/0.8]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t(`teacher.curriculum.${value}`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
            {t("teacher.curriculum.lessonTitle")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder={t("teacher.curriculum.lessonTitlePlaceholder")}
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
            {t("teacher.lesson.description")}
          </label>
          <Textarea
            placeholder={t("teacher.lesson.descriptionPlaceholder")}
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
          />
        </div>

        {/* Video Upload (for video type) */}
        {formData.kind === "video" && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.lesson.uploadVideo")}
            </label>
            <div
              className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] p-4 cursor-pointer hover:bg-[rgb(var(--bg-muted))/0.8] transition-colors"
              onClick={() =>
                document.getElementById("lesson-video-upload").click()
              }
            >
              {videoFile ? (
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-500" />
                  <span className="text-sm truncate max-w-[200px]">
                    {videoFile.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoFile(null);
                    }}
                    className="p-1 rounded-full hover:bg-[rgb(var(--bg-surface))]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : formData.videoFileId ? (
                <div className="flex items-center gap-2 text-green-500">
                  <Video className="h-5 w-5" />
                  <span className="text-sm">
                    {t("teacher.lesson.videoUploaded")}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-[rgb(var(--text-muted))]">
                  <Upload className="h-6 w-6" />
                  <span className="text-xs">
                    {t("teacher.lesson.videoFormats")}
                  </span>
                </div>
              )}
              <input
                id="lesson-video-upload"
                type="file"
                className="hidden"
                accept="video/*"
                onChange={handleVideoUpload}
              />
            </div>
            {formData.durationSec > 0 && (
              <p className="mt-1 text-xs text-[rgb(var(--text-secondary))]">
                {t("teacher.curriculum.duration")}:{" "}
                {Math.floor(formData.durationSec / 60)}:
                {(formData.durationSec % 60).toString().padStart(2, "0")}
              </p>
            )}
          </div>
        )}

        {/* Article Content (for article type) */}
        {formData.kind === "article" && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.lesson.articleContent")}
            </label>
            <Textarea
              placeholder={t("teacher.lesson.articlePlaceholder")}
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={8}
            />
          </div>
        )}

        {/* Attachments */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
            {t("teacher.lesson.attachments")}
          </label>

          {/* Attachments list */}
          {attachments.length > 0 && (
            <ul className="mb-2 space-y-1">
              {attachments.map((att) => (
                <li
                  key={att.id}
                  className="flex items-center justify-between rounded-lg bg-[rgb(var(--bg-muted))] px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <File className="h-4 w-4 text-[rgb(var(--text-muted))] flex-shrink-0" />
                    <span className="text-sm truncate">{att.name}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="p-1 rounded-full hover:bg-[rgb(var(--bg-surface))] text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add attachment button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              document.getElementById("lesson-attachment-upload").click()
            }
            disabled={uploading}
          >
            {uploading
              ? t("common.loading")
              : t("teacher.lesson.addAttachment")}
          </Button>
          <input
            id="lesson-attachment-upload"
            type="file"
            className="hidden"
            onChange={handleAttachmentUpload}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={saving || uploading}
        >
          {t("common.cancel")}
        </Button>
        <Button onClick={handleSave} disabled={saving || uploading}>
          {saving ? t("teacher.form.saving") : t("common.save")}
        </Button>
      </div>
    </Modal>
  );
}
