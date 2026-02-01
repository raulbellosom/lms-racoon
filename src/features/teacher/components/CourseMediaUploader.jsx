import React from "react";
import { useTranslation } from "react-i18next";
import {
  Image as ImageIcon,
  X,
  Upload,
  Video as VideoIcon,
  LayoutTemplate,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";
import { BannerSelectionModal } from "./BannerSelectionModal";
import { FileService } from "../../../shared/data/files";
import { getBannerById } from "../../../shared/assets/banners";
import { useToast } from "../../../app/providers/ToastProvider";
import {
  LoadingSpinner,
  LoadingContent,
} from "../../../shared/ui/LoadingScreen";
import { useUploadProgress } from "../../../app/providers/UploadProgressContext";

/**
 * CourseMediaUploader - Cover image and promo video uploader
 * @param {Object} formData - Form state object
 * @param {Function} setFormData - State setter function
 * @param {boolean} uploading - Upload in progress state
 * @param {Function} setUploading - Set upload state
 * @param {string} courseId - Course ID for fetching lessons
 */
// No explicit props, used inside component
// No explicit props, used inside component
// Hooks moved inside component body

// ... rest of component

// ... rest of component
export function CourseMediaUploader({
  formData,
  setFormData,
  uploading = false,
  setUploading,
  courseId,
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [previewUrl, setPreviewUrl] = React.useState(null);
  const [bannerModalOpen, setBannerModalOpen] = React.useState(false);

  // Upload Progress
  const uploadProgressManager = useUploadProgress();
  const [localPreview, setLocalPreview] = React.useState(null);
  const [coverViewerOpen, setCoverViewerOpen] = React.useState(false);
  const [bannerViewerOpen, setBannerViewerOpen] = React.useState(false);

  // Generate preview URL if cover exists (existing code)
  React.useEffect(() => {
    if (formData.coverFileId) {
      const url = FileService.getCourseCoverUrl(formData.coverFileId);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, [formData.coverFileId]);

  // Helper to get banner preview
  const getBannerPreviewUrl = () => {
    if (formData.promoVideoProvider === "minio" && formData.promoVideoHlsUrl) {
      if (formData.promoVideoCoverFileId) {
        return FileService.getCourseCoverUrl(formData.promoVideoCoverFileId);
      }
      return null;
    }
    if (formData.bannerFileId) {
      const pattern = getBannerById(formData.bannerFileId);
      if (pattern) return pattern.url;
      return FileService.getCourseCoverUrl(formData.bannerFileId);
    }
    return null;
  };

  const bannerPreviewUrl = getBannerPreviewUrl();

  // ... existing handleCoverUpload ...
  const handleCoverUpload = async (e) => {
    // ... (keep existing implementation)
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type (allow images and common mobile formats)
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
      "image/heif",
    ];
    const validExtensions = [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
      "heic",
      "heif",
    ];
    const extension = file.name.split(".").pop().toLowerCase();

    const isValidType =
      file.type.startsWith("image/") || validTypes.includes(file.type);
    const isValidExtension = validExtensions.includes(extension);

    if (!isValidType && !isValidExtension) {
      showToast(
        t("teacher.errors.uploadFailed") + " (Formato no soportado)",
        "error",
      );
      return;
    }

    // Validate file size (max 30MB)
    if (file.size > 30 * 1024 * 1024) {
      showToast(`${t("teacher.errors.uploadFailed")} (max 30MB)`, "error");
      return;
    }

    setUploading?.(true);
    const uploadId = uploadProgressManager.addUpload(file.name, "cover");

    try {
      // Delete old cover if exists
      if (formData.coverFileId) {
        try {
          await FileService.deleteCourseCover(formData.coverFileId);
        } catch (e) {
          console.warn("Failed to delete old cover:", e);
        }
      }

      const fileId = await FileService.uploadCourseCover(file, (progress) => {
        // Appwrite progress event
        if (progress.total > 0) {
          const percentage = Math.round(
            (progress.loaded / progress.total) * 100,
          );
          uploadProgressManager.updateProgress(uploadId, percentage);
        }
      });

      setFormData((prev) => ({ ...prev, coverFileId: fileId }));

      // Create local preview
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      uploadProgressManager.markComplete(uploadId);
    } catch (error) {
      console.error("Cover upload failed:", error);
      showToast(t("teacher.errors.uploadFailed"), "error");
      uploadProgressManager.markError(uploadId, error.message);
    } finally {
      setUploading?.(false);
    }
  };

  // ... existing handleRemoveCover ...
  const handleRemoveCover = async () => {
    if (formData.coverFileId) {
      try {
        await FileService.deleteCourseCover(formData.coverFileId);
      } catch (e) {
        console.warn("Failed to delete cover:", e);
      }
    }
    setFormData((prev) => ({ ...prev, coverFileId: "" }));
    setPreviewUrl(null);
  };

  const handleBannerSelect = async (selection) => {
    if (selection.type === "video") {
      // If there was a banner file (not a pattern), delete it to save space
      const oldBannerId = formData.bannerFileId;
      if (oldBannerId && !getBannerById(oldBannerId)) {
        try {
          await FileService.deleteCourseCover(oldBannerId);
        } catch (e) {
          console.warn("Failed to delete replaced banner:", e);
        }
      }

      setFormData((prev) => ({
        ...prev,
        promoVideoProvider: selection.provider,
        promoVideoHlsUrl: selection.hlsUrl || "",
        promoVideoCoverFileId: selection.coverId || "", // Ensure this is set
        bannerFileId: "", // Clear banner, video takes priority
      }));
    } else {
      // Selecting a banner (image or pattern)
      // If there was a previous banner file (not a pattern), delete it
      const oldBannerId = formData.bannerFileId;
      if (
        oldBannerId &&
        !getBannerById(oldBannerId) &&
        oldBannerId !== selection.value
      ) {
        try {
          await FileService.deleteCourseCover(oldBannerId);
        } catch (e) {
          console.warn("Failed to delete replaced banner:", e);
        }
      }

      // We do NOT delete the promo video file locally (it belongs to a lesson)
      // just clear the video fields from the form so banner takes priority
      setFormData((prev) => ({
        ...prev,
        bannerFileId: selection.value,
        promoVideoProvider: "appwrite", // Reset provider
        promoVideoHlsUrl: "",
        promoVideoCoverFileId: "", // Clear video cover
      }));
    }
  };

  const handleRemoveBanner = async () => {
    // Only delete banner file physically (if it's not a pattern)
    // NEVER delete promo video file physically (it belongs to a lesson)
    const oldBannerId = formData.bannerFileId;
    if (oldBannerId && !getBannerById(oldBannerId)) {
      try {
        await FileService.deleteCourseCover(oldBannerId);
      } catch (e) {
        console.warn("Failed to delete removed banner:", e);
      }
    }

    setFormData((prev) => ({
      ...prev,
      bannerFileId: "",
      promoVideoProvider: "appwrite",
      promoVideoHlsUrl: "",
      promoVideoCoverFileId: "",
    }));
  };

  return (
    <Card className="p-4 sm:p-6 space-y-6">
      {/* Cover Image Section */}
      <div>
        <h3 className="mb-4 text-lg font-bold">{t("teacher.coverImage")}</h3>
        <div className="relative flex aspect-video w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] text-center overflow-hidden">
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Cover preview"
                className="absolute inset-0 h-full w-full object-cover cursor-pointer transition-transform hover:scale-105"
                onClick={() => setCoverViewerOpen(true)}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    !uploading &&
                      document.getElementById("cover-upload").click();
                  }}
                  className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  title={t("teacher.form.uploadCover")}
                >
                  <Upload className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCover();
                  }}
                  className="p-1.5 rounded-full bg-black/50 text-white hover:bg-red-600 transition-colors"
                  title={t("common.delete")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                Click para ver a pantalla completa
              </div>
            </>
          ) : (
            <div
              className="text-[rgb(var(--text-muted))] cursor-pointer"
              onClick={() =>
                !uploading && document.getElementById("cover-upload").click()
              }
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <LoadingContent className="py-2" />
                  <span className="text-xs font-medium">
                    {t("common.loading")}
                  </span>
                </div>
              ) : (
                <>
                  <ImageIcon className="mx-auto h-8 w-8 mb-2" />
                  <span className="text-xs font-medium">
                    {t("teacher.form.uploadCover")}
                  </span>
                </>
              )}
            </div>
          )}

          <input
            id="cover-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleCoverUpload}
            disabled={uploading}
          />
        </div>
        <p className="mt-2 text-[10px] text-[rgb(var(--text-secondary))] text-center">
          {t("teacher.form.coverRecommended")}
        </p>
      </div>

      {/* Banner / Trailer Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Banner / Trailer</h3>
          {(formData.bannerFileId ||
            (formData.promoVideoProvider === "minio" &&
              formData.promoVideoHlsUrl)) && (
            <button
              onClick={handleRemoveBanner}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Eliminar
            </button>
          )}
        </div>

        <div className="relative flex aspect-video w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] text-center overflow-hidden">
          {bannerPreviewUrl ? (
            <>
              <img
                src={bannerPreviewUrl}
                alt="Banner preview"
                className="absolute inset-0 h-full w-full object-cover cursor-pointer transition-transform hover:scale-105"
                onClick={() => setBannerViewerOpen(true)}
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBannerModalOpen(true);
                  }}
                  className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  title="Cambiar Banner/Trailer"
                >
                  <LayoutTemplate className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBanner();
                  }}
                  className="p-1.5 rounded-full bg-black/50 text-white hover:bg-red-600 transition-colors"
                  title={t("common.delete")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                Click para ver a pantalla completa
              </div>
            </>
          ) : (
            <div
              className="text-[rgb(var(--text-muted))] cursor-pointer flex flex-col items-center"
              onClick={() => setBannerModalOpen(true)}
            >
              <LayoutTemplate className="h-8 w-8 mb-2" />
              <span className="text-xs font-medium">
                Seleccionar Banner o Trailer
              </span>
              <span className="text-[10px] text-[rgb(var(--text-secondary))] mt-1">
                Imagen, Patrón o Video del curso
              </span>
            </div>
          )}
        </div>
      </div>

      <BannerSelectionModal
        open={bannerModalOpen}
        onOpenChange={setBannerModalOpen}
        onSelect={handleBannerSelect}
        courseId={courseId}
        currentBannerId={formData.bannerFileId}
        currentVideoHlsUrl={formData.promoVideoHlsUrl}
      />

      {/* Cover Image Viewer */}
      <ImageViewerModal
        isOpen={coverViewerOpen}
        onClose={() => setCoverViewerOpen(false)}
        src={previewUrl}
        alt={t("teacher.coverImage")}
        showDownload={true}
      />

      {/* Banner Image Viewer */}
      {(formData.bannerFileId ||
        (formData.promoVideoProvider === "minio" &&
          formData.promoVideoHlsUrl)) && (
        <ImageViewerModal
          isOpen={bannerViewerOpen}
          onClose={() => setBannerViewerOpen(false)}
          src={bannerPreviewUrl || ""}
          alt="Banner / Trailer Preview"
          showDownload={true}
        />
      )}
    </Card>
  );
}
