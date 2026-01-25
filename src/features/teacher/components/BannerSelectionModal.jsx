import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Upload,
  Video,
  Image as ImageIcon,
  Check,
  PlayCircle,
  LayoutTemplate,
} from "lucide-react";
import { Modal } from "../../../shared/ui/Modal";
import { Button } from "../../../shared/ui/Button";
import { FileService } from "../../../shared/data/files";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { DEFAULT_BANNERS } from "../../../shared/assets/banners";

export function BannerSelectionModal({
  open,
  onOpenChange,
  onSelect,
  courseId,
  currentBannerId,
  currentVideoId,
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("upload"); // upload, video, patterns
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch lessons when video tab is active
  useEffect(() => {
    if (activeTab === "video" && courseId && lessons.length === 0) {
      loadLessons();
    }
  }, [activeTab, courseId]);

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
      alert(t("teacher.errors.invalidFileType"));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      // 8MB
      alert(t("teacher.errors.fileTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const fileId = await FileService.uploadCourseCover(file); // Reusing courseCovers bucket for banners
      onSelect({ type: "image", value: fileId });
      onOpenChange(false);
    } catch (error) {
      console.error("Banner upload failed", error);
      alert(t("teacher.errors.uploadFailed"));
    } finally {
      setUploading(false);
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
      <div className="flex flex-col gap-6 mt-4">
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
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "patterns"
                ? "border-[rgb(var(--brand-primary))] text-[rgb(var(--brand-primary))]"
                : "border-transparent text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]"
            }`}
            onClick={() => setActiveTab("patterns")}
          >
            <div className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" />
              {t("teacher.banner.patternsTab") || "Patrones"}
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {/* UPLOAD TAB */}
          {activeTab === "upload" && (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[rgb(var(--border-base))] rounded-xl bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--bg-muted))/0.8] transition-colors relative">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <div className="text-center p-6 pointer-events-none">
                {uploading ? (
                  <div className="animate-spin h-8 w-8 border-2 border-[rgb(var(--brand-primary))] border-t-transparent rounded-full mx-auto mb-4" />
                ) : (
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-[rgb(var(--text-muted))]" />
                )}
                <h3 className="text-lg font-medium mb-1">
                  {uploading
                    ? t("common.uploading")
                    : t("teacher.banner.dragDrop") ||
                      "Click o arrastra para subir"}
                </h3>
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                  JPG, PNG, WEBP (Max 8MB)
                </p>
              </div>
            </div>
          )}

          {/* VIDEO TAB */}
          {activeTab === "video" && (
            <div className="space-y-4">
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                {t("teacher.banner.videoDescription") ||
                  "Selecciona un video de tus lecciones para usarlo como trailer del curso."}
              </p>
              {loadingLessons ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-2 border-[rgb(var(--brand-primary))] border-t-transparent rounded-full" />
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center p-8 border rounded-xl bg-[rgb(var(--bg-muted))]">
                  <Video className="h-10 w-10 mx-auto mb-3 text-[rgb(var(--text-muted))]" />
                  <p className="font-medium">
                    {t("teacher.banner.noVideos") ||
                      "No hay lecciones con video en este curso."}
                  </p>
                  <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
                    Sube videos en la pestaña de Contenido primero.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.$id}
                      className={`
                                    relative p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md
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
                        });
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-24 bg-black/10 rounded-lg flex items-center justify-center shrink-0">
                          <PlayCircle className="h-8 w-8 text-[rgb(var(--text-muted))]" />
                        </div>
                        <div className="min-w-0 pr-6">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {lesson.title}
                          </h4>
                          <span className="text-xs text-[rgb(var(--text-secondary))] block mt-1">
                            {t("common.lesson")}
                          </span>
                        </div>
                        {currentVideoId === lesson.videoFileId && (
                          <div className="absolute top-3 right-3 h-5 w-5 bg-[rgb(var(--brand-primary))] rounded-full flex items-center justify-center">
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

          {/* PATTERNS TAB */}
          {activeTab === "patterns" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {DEFAULT_BANNERS.map((banner) => (
                <div
                  key={banner.id}
                  className={`
                                relative aspect-video rounded-xl cursor-pointer overflow-hidden border-2 transition-all
                                ${
                                  currentBannerId === banner.id
                                    ? "border-[rgb(var(--brand-primary))]"
                                    : "border-transparent hover:border-[rgb(var(--brand-primary))/0.5]"
                                }
                            `}
                  onClick={() => {
                    onSelect({ type: "image", value: banner.id });
                    onOpenChange(false);
                  }}
                >
                  <img
                    src={banner.url}
                    alt={banner.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/5 hover:bg-transparent transition-colors" />

                  {currentBannerId === banner.id && (
                    <div className="absolute top-2 right-2 h-6 w-6 bg-[rgb(var(--brand-primary))] rounded-full flex items-center justify-center shadow-sm">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
