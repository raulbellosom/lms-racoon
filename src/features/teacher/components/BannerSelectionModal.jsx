import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Upload,
  Video,
  Image as ImageIcon,
  Check,
  PlayCircle,
  LayoutTemplate,
  X,
} from "lucide-react";
import { Modal } from "../../../shared/ui/Modal";
import { FileService } from "../../../shared/data/files";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { DEFAULT_BANNERS } from "../../../shared/assets/banners";
import { useToast } from "../../../app/providers/ToastProvider";

export function BannerSelectionModal({
  open,
  onOpenChange,
  onSelect,
  courseId,
  currentBannerId,
  currentVideoId,
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("upload"); // upload, video, patterns
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch lessons when video tab is active
  useEffect(() => {
    if (activeTab === "video" && courseId && lessons.length === 0) {
      loadLessons();
    }
  }, [activeTab, courseId, lessons.length]);

  const loadLessons = async () => {
    setLoadingLessons(true);
    try {
      const allLessons = await LessonService.listByCourse(courseId);
      // Filter lessons that have a video
      const videoLessons = allLessons.filter((l) => l.videoFileId);
      setLessons(videoLessons);
    } catch (error) {
      console.error("Failed to load lessons for video selection", error);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      showToast(t("teacher.errors.invalidFileType"), "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      // 8MB
      showToast(t("teacher.errors.fileTooLarge"), "error");
      return;
    }

    setUploading(true);
    try {
      const fileId = await FileService.uploadCourseCover(file);
      onSelect({ type: "image", value: fileId });
      onOpenChange(false);
    } catch (error) {
      console.error("Banner upload failed", error);
      showToast(t("teacher.errors.uploadFailed"), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBanner = async () => {
    try {
      // Delete from storage if it's a file ID (not a pattern)
      if (
        currentBannerId &&
        !DEFAULT_BANNERS.find((b) => b.id === currentBannerId)
      ) {
        await FileService.deleteFile(currentBannerId);
      }
      onSelect({ type: "image", value: null });
    } catch (error) {
      console.error("Failed to delete banner", error);
      showToast(t("teacher.errors.deleteFailed"), "error");
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        t("teacher.banner.selectModalTitle") || "Seleccionar Banner / Trailer"
      }
      className="max-w-3xl"
    >
      <div className="mt-4 flex flex-col gap-6">
        {/* Tabs Navigation */}
        <div className="flex border-b border-[rgb(var(--border-base))]">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "upload"
                ? "border-[rgb(var(--brand-primary))] text-[rgb(var(--brand-primary))]"
                : "border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
            }`}
            onClick={() => setActiveTab("upload")}
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {t("teacher.banner.uploadTab") || "Subir Imagen"}
            </div>
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "video"
                ? "border-[rgb(var(--brand-primary))] text-[rgb(var(--brand-primary))]"
                : "border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
            }`}
            onClick={() => setActiveTab("video")}
          >
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              {t("teacher.banner.videoTab") || "Usar Video del Curso"}
            </div>
          </button>
        </div>

        {/* Current Selection Status */}
        {(currentBannerId || currentVideoId) && (
          <div className="rounded-lg bg-[rgb(var(--bg-muted))] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {currentBannerId && (
                <>
                  <ImageIcon className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
                  <span className="font-medium">Banner de imagen actual</span>
                </>
              )}
              {currentVideoId && (
                <>
                  <PlayCircle className="h-4 w-4 text-[rgb(var(--brand-primary))]" />
                  <span className="font-medium">
                    Trailer actual seleccionado
                  </span>
                </>
              )}
            </div>
            <span className="text-xs text-[rgb(var(--text-muted))]">
              Selecciona uno nuevo para reemplazar
            </span>
          </div>
        )}

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {/* UPLOAD TAB */}
          {activeTab === "upload" && (
            <div className="relative flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] transition-colors hover:bg-[rgb(var(--bg-muted))/0.8]">
              {currentBannerId &&
              !DEFAULT_BANNERS.find((b) => b.id === currentBannerId) ? (
                // Show current banner with delete option
                <>
                  <img
                    src={FileService.getCourseCoverUrl(currentBannerId)}
                    alt="Current banner"
                    className="absolute inset-0 h-full w-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <span className="text-white text-sm font-medium">
                      Banner actual
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveBanner}
                    className="absolute top-2 right-2 p-2 rounded-full bg-red-500/90 text-white hover:bg-red-600 transition-colors z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("banner-file-input").click()
                    }
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-lg"
                  >
                    Reemplazar imagen
                  </button>
                </>
              ) : (
                // Show upload area
                <>
                  <input
                    id="banner-file-input"
                    type="file"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <div className="pointer-events-none p-6 text-center">
                    {uploading ? (
                      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[rgb(var(--brand-primary))] border-t-transparent" />
                    ) : (
                      <ImageIcon className="mx-auto mb-4 h-12 w-12 text-[rgb(var(--text-muted))]" />
                    )}
                    <h3 className="mb-1 text-lg font-medium">
                      {uploading
                        ? t("common.uploading")
                        : t("teacher.banner.dragDrop") ||
                          "Click o arrastra para subir"}
                    </h3>
                    <p className="text-sm text-[rgb(var(--text-secondary))]">
                      JPG, PNG, WEBP (Max 8MB)
                    </p>
                  </div>
                </>
              )}
              {/* Hidden input for replacement */}
              <input
                id="banner-file-input"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
          )}

          {/* VIDEO TAB */}
          {activeTab === "video" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                  {t("teacher.banner.videoDescription") ||
                    "Selecciona un video de tus lecciones para usarlo como trailer del curso."}
                </p>
                {currentVideoId && (
                  <button
                    onClick={() => onSelect({ type: "video", value: null })}
                    className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Deseleccionar
                  </button>
                )}
              </div>
              {loadingLessons ? (
                <div className="flex justify-center p-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[rgb(var(--brand-primary))] border-t-transparent" />
                </div>
              ) : lessons.length === 0 ? (
                <div className="rounded-xl border bg-[rgb(var(--bg-muted))] p-8 text-center">
                  <Video className="mx-auto mb-3 h-10 w-10 text-[rgb(var(--text-muted))]" />
                  <p className="font-medium">
                    {t("teacher.banner.noVideos") ||
                      "No hay lecciones con video en este curso."}
                  </p>
                  <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                    Sube videos en la pestaña de Contenido primero.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.$id}
                      className={`
                                    relative cursor-pointer rounded-xl border p-3 transition-all hover:shadow-md
                                    ${
                                      currentVideoId === lesson.videoFileId
                                        ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))/0.05]"
                                        : "border-[rgb(var(--border-base))] hover:border-[rgb(var(--brand-primary))/0.5]"
                                    }
                                `}
                      onClick={() => {
                        onSelect({
                          type: "video",
                          value: lesson.videoFileId,
                          coverId: lesson.videoCoverFileId,
                        });
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-black/10">
                          <PlayCircle className="h-8 w-8 text-[rgb(var(--text-muted))]" />
                        </div>
                        <div className="min-w-0 pr-6">
                          <h4 className="line-clamp-2 text-sm font-medium">
                            {lesson.title}
                          </h4>
                          <span className="mt-1 block text-xs text-[rgb(var(--text-secondary))]">
                            {t("common.lesson")}
                          </span>
                        </div>
                        {currentVideoId === lesson.videoFileId && (
                          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--brand-primary))]">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
