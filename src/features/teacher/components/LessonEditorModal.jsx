import React from "react";
import { useNavigate } from "react-router-dom";
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
  Check,
  Edit2,
  Image,
  Settings,
} from "lucide-react";
import { Modal } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";
import { Textarea } from "../../../shared/ui/Textarea";
import { Button } from "../../../shared/ui/Button";
import { FileService } from "../../../shared/data/files";
import { QuizService } from "../../../shared/data/quizzes-teacher";
import { AssignmentService } from "../../../shared/data/assignments-teacher";
import { useToast } from "../../../app/providers/ToastProvider";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { CharacterCountCircle } from "./CharacterCountCircle";
import { QuizEditorModal } from "./QuizEditorModal";
import { AssignmentEditorModal } from "./AssignmentEditorModal";
import { VideoApi } from "../../../shared/services/videoApi";
import { LessonService } from "../../../shared/data/lessons-teacher";

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
 * Helper to get file icon and color
 */
const getFileStyle = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
    return {
      icon: Image,
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    };
  }
  if (["pdf"].includes(ext)) {
    return {
      icon: FileText,
      color: "text-red-500",
      bg: "bg-red-100 dark:bg-red-900/30",
    };
  }
  if (["doc", "docx", "txt", "md"].includes(ext)) {
    return {
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    };
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return {
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    };
  }
  if (["ppt", "pptx"].includes(ext)) {
    return {
      icon: FileText,
      color: "text-orange-500",
      bg: "bg-orange-100 dark:bg-orange-900/30",
    };
  }
  if (["zip", "rar", "7z"].includes(ext)) {
    return {
      icon: File,
      color: "text-yellow-600",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
    };
  }
  if (["mp4", "webm", "mov", "mkv"].includes(ext)) {
    return {
      icon: Video,
      color: "text-purple-500",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    };
  }
  if (["mp3", "wav", "ogg"].includes(ext)) {
    return {
      icon: File,
      color: "text-pink-500",
      bg: "bg-pink-100 dark:bg-pink-900/30",
    };
  }
  if (["js", "css", "html", "json", "ts", "jsx"].includes(ext)) {
    return {
      icon: FileText,
      color: "text-slate-500",
      bg: "bg-slate-100 dark:bg-slate-800",
    };
  }

  return {
    icon: File,
    color: "text-gray-500",
    bg: "bg-gray-100 dark:bg-gray-800",
  };
};

/**
 * LessonEditorModal - Modal for creating/editing a lesson
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
  const { showToast } = useToast();
  const isNew = !lesson?.$id;

  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    kind: "video",
    videoFileId: "",
    videoCoverFileId: "",
    durationSec: 0,
  });

  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [videoFile, setVideoFile] = React.useState(null);
  const [coverFile, setCoverFile] = React.useState(null);
  const [attachments, setAttachments] = React.useState([]);

  // Child Modals State
  const [quizModalOpen, setQuizModalOpen] = React.useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = React.useState(false);

  // Data for Child Modals
  // If we have a connected quiz/assignment, we store it here
  const [relatedEntity, setRelatedEntity] = React.useState(null);
  const [loadingRelated, setLoadingRelated] = React.useState(false);

  // Inline editing state for attachments
  const [editingAttachmentId, setEditingAttachmentId] = React.useState(null);
  const [editingName, setEditingName] = React.useState("");

  const startEditing = (att) => {
    setEditingAttachmentId(att.id);
    setEditingName(att.name);
  };

  const saveEditing = (attId) => {
    if (!editingName.trim()) return;
    setAttachments((prev) =>
      prev.map((a) =>
        a.id === attId ? { ...a, name: editingName.trim() } : a,
      ),
    );
    setEditingAttachmentId(null);
  };

  const cancelEditing = () => {
    setEditingAttachmentId(null);
    setEditingName("");
  };

  // Load lesson data
  React.useEffect(() => {
    const loadData = async () => {
      if (lesson) {
        setFormData({
          title: lesson.title || "",
          description: lesson.description || "",
          kind: lesson.kind || "video",
          videoFileId: lesson.videoFileId || "",
          videoCoverFileId: lesson.videoCoverFileId || "",
          durationSec: lesson.durationSec || 0,
          isFreePreview: lesson.isFreePreview || false,
        });

        // Load attachments
        if (lesson.attachments && Array.isArray(lesson.attachments)) {
          const loadedAttachments = await Promise.all(
            lesson.attachments.map(async (id) => {
              try {
                const meta = await FileService.getLessonAttachmentMetadata(id);
                return {
                  id: meta.$id,
                  name: meta.name,
                  size: meta.sizeOriginal,
                };
              } catch (e) {
                console.warn(`Failed to load attachment ${id}`, e);
                return { id, name: "Archivo desconocido", size: 0 };
              }
            }),
          );
          setAttachments(loadedAttachments);
        } else {
          try {
            const oldJson = JSON.parse(lesson.attachmentsJson || "[]");
            setAttachments(oldJson);
          } catch {
            setAttachments([]);
          }
        }

        // Load related entity (Quiz or Assignment)
        fetchRelatedEntity(lesson.$id, lesson.kind);
      } else {
        setFormData({
          title: "",
          description: "",
          kind: "video",
          videoFileId: "",
          videoCoverFileId: "",
          durationSec: 0,
          isFreePreview: false,
        });
        setAttachments([]);
        setRelatedEntity(null);
      }
      setVideoFile(null);
      setCoverFile(null);
    };
    if (open) loadData();
  }, [lesson, open]);

  // When kind changes, clear related entity if mismatched?
  // Actually if we switch from Quiz to Video, we ignore the quiz.
  // But if we switch back to Quiz, we should try to re-fetch?
  // For now, simpler: Only fetch on load or after save.

  const fetchRelatedEntity = async (lessonId, kind) => {
    if (!lessonId) return;
    setLoadingRelated(true);
    setRelatedEntity(null);
    try {
      if (kind === "quiz") {
        const quizzes = await QuizService.listByLesson(lessonId);
        if (quizzes.length > 0) setRelatedEntity(quizzes[0]);
      } else if (kind === "assignment") {
        const assignments = await AssignmentService.listByLesson(lessonId);
        if (assignments.length > 0) setRelatedEntity(assignments[0]);
      }
    } catch (e) {
      console.error("Failed to load related entity", e);
    } finally {
      setLoadingRelated(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Markdown Options
  const mdeOptions = React.useMemo(
    () => ({
      spellChecker: false,
      maxHeight: "300px",
      placeholder: t("teacher.lesson.descriptionPlaceholder"),
      status: false,
      toolbar: [
        "bold",
        "italic",
        "heading",
        "|",
        "quote",
        "unordered-list",
        "ordered-list",
        "|",
        "preview",
      ],
    }),
    [t],
  );

  // Handlers for file uploads (video/cover/attachments)...
  // (Same as before, abbreviated here for clarity but keeping logic)
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      showToast(t("teacher.errors.uploadFailed"), "error");
      return;
    }
    setVideoFile(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      updateField("durationSec", Math.round(video.duration));
    };
    video.src = URL.createObjectURL(file);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast(t("teacher.errors.uploadFailed") + " (Solo imágenes)", "error");
      return;
    }
    setCoverFile(file);
  };

  const handleRemoveCover = async () => {
    // If it was a new file
    if (coverFile) {
      setCoverFile(null);
      return;
    }
    // If it was an existing file
    if (formData.videoCoverFileId) {
      // We set it to empty string to mark for deletion/removal in save
      // But wait, if we save, we check if(coverFile).
      // If we want to strictly remove it, we need state for that.
      // Simplest: just clear formData.videoCoverFileId and maybe call API immediately or handle in save?
      // User asked: "logica de eliminacion ... cada que se remplace".
      // Replacement is handled in save.
      // What about valid explicit deletion?
      // If I click garbage icon, I probably want to remove it.
      try {
        if (formData.videoCoverFileId) {
          await FileService.deleteCourseCover(formData.videoCoverFileId);
        }
        updateField("videoCoverFileId", "");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const attachment = await FileService.uploadLessonAttachment(file);
      setAttachments((prev) => [...prev, attachment]);
    } catch (error) {
      console.error("Attachment upload failed:", error);
      showToast(t("teacher.errors.uploadFailed"), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId) => {
    try {
      await FileService.deleteLessonAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (error) {
      console.error("Failed to delete attachment:", error);
    }
  };

  // Save lesson
  const handleSave = async (andOpenConfig = false) => {
    if (!formData.title.trim()) {
      showToast(t("teacher.form.titleRequired"), "error");
      return;
    }

    setSaving(true);
    try {
      let videoCoverFileId = formData.videoCoverFileId;

      // 1. Handle Cover Image (Appwrite Storage)
      if (coverFile) {
        if (formData.videoCoverFileId) {
          try {
            await FileService.deleteCourseCover(formData.videoCoverFileId);
          } catch {}
        }
        videoCoverFileId = await FileService.uploadCourseCover(coverFile);
      }

      const lessonData = {
        courseId,
        sectionId: section.$id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        kind: formData.kind,
        videoCoverFileId,
        // videoFileId will be removed/ignored for new video flow
        // but if we want to keep legacy compatibility, we might leave it if we didn't touch it?
        // Plan says remove it. Let's not send it if we are doing MinIO.
        durationSec: formData.durationSec,
        isFreePreview: formData.isFreePreview,
        attachments: attachments.map((a) => a.id),
      };

      // 2. Save Lesson to get ID
      const savedLesson = await onSave?.(lessonData, lesson?.$id);

      // 3. Handle Video Upload (MinIO) if there is a new video file
      if (videoFile && savedLesson?.$id) {
        try {
          // Upload to MinIO / VideoAPI
          const videoResponse = await VideoApi.uploadVideo(
            savedLesson.$id,
            videoFile,
          );

          // Update Lesson with MinIO data
          await LessonService.update(savedLesson.$id, {
            videoProvider: "minio",
            videoObjectKey: videoResponse.videoObjectKey,
            videoHlsUrl: videoResponse.videoHlsUrl,
            videoStatus: "ready",
            durationSec: videoResponse.durationSec || formData.durationSec,
          });
        } catch (videoError) {
          console.error("Video upload failed:", videoError);
          showToast(
            "Lesson saved but video upload failed: " + videoError.message,
            "error",
          );
        }
      }

      // If we want to open config immediately
      if (andOpenConfig && savedLesson?.$id) {
        if (formData.kind === "quiz") {
          setQuizModalOpen(true);
        } else if (formData.kind === "assignment") {
          setAssignmentModalOpen(true);
        }
      } else if (!andOpenConfig) {
        onClose();
      }

      // Refresh related data in case we just created the lesson
      if (savedLesson?.$id) {
        fetchRelatedEntity(savedLesson.$id, formData.kind);
      }
    } catch (error) {
      console.error("Failed to save lesson:", error);
      showToast(t("teacher.errors.saveFailed"), "error");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const navigate = useNavigate();

  const handleOpenConfig = () => {
    // If lesson exists, open. If not, ask to save.
    if (isNew) {
      // Trigger save first?
      showToast(t("teacher.errors.saveFirst"), "info");
    } else {
      if (formData.kind === "quiz") {
        // Navigate to new Quiz Editor Page
        navigate(
          `/app/teach/courses/${courseId}/curriculum/${lesson.$id}/quiz`,
        );
        // We should probably close this modal too?
        // Yes, UX: Go to new page.
        // onClose(); // Wait, if we close, do we lose state? No, because we navigated away.
        // Actually, React Router navigation unmounts the current route components usually?
        // LessonEditorModal is a child of TeacherCourseEditorPage (likely).
        // If we navigate to .../curriculum/.../quiz, it is a nested route?
        // No, I defined it as a sibling of "courses/:courseId" in the router structure?
        // Let's check router.jsx structure.
        // It is under `app/teach/children`.
        // `courses/:courseId` matches `TeacherCourseEditorPage`.
        // `courses/:courseId/curriculum/:lessonId/quiz` matches `TeacherQuizEditorPage`.
        // So yes, it will unmount the CourseEditorPage and mount QuizEditorPage.
        // So onClose call is redundant but fine.
      }
      if (formData.kind === "assignment") {
        navigate(
          `/app/teach/courses/${courseId}/curriculum/${lesson.$id}/assignment`,
        );
      }
    }
  };

  const handleConfigSaved = () => {
    // Refresh related entity
    if (lesson?.$id) fetchRelatedEntity(lesson.$id, formData.kind);
    showToast(t("common.saved"), "success");
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={
          isNew
            ? t("teacher.lesson.createTitle")
            : t("teacher.lesson.editTitle")
        }
        className="max-w-full! sm:max-w-5xl! md:max-w-6xl! lg:max-w-7xl!"
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={saving || uploading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={saving || uploading}
            >
              {saving ? t("teacher.form.saving") : t("common.save")}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                {t("teacher.curriculum.lessonTitle")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <CharacterCountCircle
                current={formData.title.length}
                max={80}
                size={18}
              />
            </div>
            <Input
              placeholder={t("teacher.curriculum.lessonTitlePlaceholder")}
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFreePreview"
              checked={formData.isFreePreview || false}
              onChange={(e) => updateField("isFreePreview", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[rgb(var(--brand-primary))] focus:ring-[rgb(var(--brand-primary))]"
            />
            <label
              htmlFor="isFreePreview"
              className="text-sm font-medium text-[rgb(var(--text-secondary))]"
            >
              {t("teacher.lesson.isFreePreview")}
            </label>
            <span className="text-xs text-[rgb(var(--text-muted))]">
              ({t("teacher.lesson.isFreePreviewDesc")})
            </span>
          </div>

          {/* CONTENT BASED ON TYPE */}
          {formData.kind === "video" && (
            <div className="space-y-4">
              {/* Video specific fields (Upload, Cover) */}
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
              </div>
              {/* Cover Image Upload (Restored) */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                  {t("teacher.lesson.uploadCover")}
                </label>
                <div
                  className="relative flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] p-4 cursor-pointer hover:bg-[rgb(var(--bg-muted))/0.8] transition-colors overflow-hidden group"
                  onClick={() =>
                    document.getElementById("lesson-cover-upload").click()
                  }
                >
                  {coverFile ? (
                    <div className="flex items-center gap-2 z-10 relative">
                      <Image className="h-5 w-5 text-blue-500" />
                      <span className="text-sm truncate max-w-[200px]">
                        {coverFile.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverFile(null);
                        }}
                        className="p-1 rounded-full bg-white/50 hover:bg-white text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : formData.videoCoverFileId ? (
                    <div className="w-64 aspect-video relative">
                      <img
                        src={FileService.getCourseCoverUrl(
                          formData.videoCoverFileId,
                        )}
                        alt="Cover"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      {/* Overlay always accessible for mobile */}
                      <div className="absolute inset-0 bg-black/10 flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCover();
                            }}
                            className="p-1.5 bg-red-500/90 text-white rounded-md hover:bg-red-600 shadow-sm"
                            title={t("common.delete")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="self-center">
                          <span className="px-2 py-1 bg-black/60 text-white text-xs rounded-full font-medium backdrop-blur-sm">
                            {t("teacher.lesson.changeCover")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[rgb(var(--text-muted))]">
                      <Image className="h-6 w-6" />
                      <span className="text-xs">
                        {t("teacher.lesson.coverFormats")}
                      </span>
                    </div>
                  )}

                  {coverFile && (
                    <div className="absolute inset-0 opacity-20 bg-blue-500 pointer-events-none" />
                  )}

                  <input
                    id="lesson-cover-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverUpload}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                  {t("teacher.lesson.description")}
                </label>
                <SimpleMDE
                  value={formData.description}
                  onChange={(val) => updateField("description", val)}
                  options={mdeOptions}
                />
              </div>
            </div>
          )}

          {formData.kind === "article" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
                {t("teacher.lesson.content")}
              </label>
              <SimpleMDE
                value={formData.description}
                onChange={(val) => updateField("description", val)}
                options={mdeOptions}
              />
            </div>
          )}

          {(formData.kind === "quiz" || formData.kind === "assignment") && (
            <div className="rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))/0.3] p-6 text-center space-y-4">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-[rgb(var(--bg-surface))] shadow-sm">
                {formData.kind === "quiz" ? (
                  <HelpCircle className="h-6 w-6 text-purple-500" />
                ) : (
                  <ClipboardList className="h-6 w-6 text-green-500" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-lg">
                  {formData.kind === "quiz"
                    ? t("teacher.quiz.settings")
                    : t("teacher.assignment.settings")}
                </h4>
                <p className="text-sm text-[rgb(var(--text-secondary))] max-w-md mx-auto mt-1">
                  {isNew
                    ? t("teacher.errors.saveFirstToConfig")
                    : t("teacher.errors.configureContent")}
                </p>
              </div>

              {!isNew ? (
                <div className="flex justify-center gap-3">
                  <Button onClick={handleOpenConfig} className="gap-2">
                    <Settings className="h-4 w-4" />
                    {formData.kind === "quiz"
                      ? t("teacher.quiz.configure")
                      : t("teacher.assignment.configure")}
                  </Button>
                  {relatedEntity && (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-medium px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <Check className="h-3 w-3" />{" "}
                      {t("teacher.lesson.configuredStatus")}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-sm text-[rgb(var(--text-muted))] italic">
                  {t("teacher.errors.saveToEnableConfig")}
                </div>
              )}
            </div>
          )}

          {/* Attachments Section (Always available) */}
          <div className="pt-4 border-t border-[rgb(var(--border-base))]">
            <label className="mb-2 block text-sm font-semibold text-[rgb(var(--text-secondary))]">
              {t("teacher.lesson.attachments")}
            </label>
            {attachments.length > 0 && (
              <ul className="mb-3 space-y-2">
                {attachments.map((att) => {
                  const { icon: FileIcon, color, bg } = getFileStyle(att.name);
                  const isEditing = editingAttachmentId === att.id;
                  return (
                    <li
                      key={att.id}
                      className="flex items-center justify-between rounded-lg bg-[rgb(var(--bg-muted))] px-3 py-2 border border-transparent hover:border-[rgb(var(--border-base))]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`h-8 w-8 flex items-center justify-center rounded ${bg} ${color} shrink-0`}
                        >
                          <FileIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          {isEditing ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-7 text-sm py-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEditing(att.id);
                                if (e.key === "Escape") cancelEditing();
                              }}
                            />
                          ) : (
                            <div
                              className="font-medium text-sm truncate"
                              title={att.name}
                            >
                              {att.name}
                            </div>
                          )}
                          {!isEditing && (
                            <div className="text-xs text-[rgb(var(--text-secondary))]">
                              {(att.size / 1024).toFixed(0)} KB
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEditing(att.id)}
                              className="p-1.5 rounded-full hover:bg-[rgb(var(--bg-surface))] text-green-500"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1.5 rounded-full hover:bg-[rgb(var(--bg-surface))] text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(att)}
                              className="p-1.5 rounded-full hover:bg-[rgb(var(--bg-surface))]"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveAttachment(att.id)}
                              className="p-1.5 rounded-full hover:bg-[rgb(var(--bg-surface))] text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                document.getElementById("lesson-attachment-upload").click()
              }
              disabled={uploading}
              className="w-full sm:w-auto"
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
      </Modal>

      {/* QUIZ EDITOR SUB-MODAL */}
      {/* QUIZ EDITOR SUB-MODAL REMOVED (Moved to page) */}
      {/* {quizModalOpen && (
        <QuizEditorModal
          open={quizModalOpen}
          onClose={() => setQuizModalOpen(false)}
          quiz={relatedEntity} // Pass existing quiz if found
          courseId={courseId}
          lessonId={lesson?.$id}
          onSave={handleConfigSaved}
        />
      )} */}

      {/* ASSIGNMENT EDITOR SUB-MODAL */}
      {assignmentModalOpen && (
        <AssignmentEditorModal
          open={assignmentModalOpen}
          onClose={() => setAssignmentModalOpen(false)}
          assignment={relatedEntity}
          courseId={courseId}
          lessonId={lesson?.$id}
          onSave={handleConfigSaved}
        />
      )}
    </>
  );
}
