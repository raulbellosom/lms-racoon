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
import { BannerSelectionModal } from "./BannerSelectionModal";
import { FileService } from "../../../shared/data/files";
import { getBannerById } from "../../../shared/assets/banners";
import { useToast } from "../../../app/providers/ToastProvider";
import { LoadingSpinner } from "../../../shared/ui/LoadingScreen";

/**
 * CourseMediaUploader - Cover image and promo video uploader
 * @param {Object} formData - Form state object
 * @param {Function} setFormData - State setter function
 * @param {boolean} uploading - Upload in progress state
 * @param {Function} setUploading - Set upload state
 * @param {string} courseId - Course ID for fetching lessons
 */
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
  const getBannerPreview = () => {
    if (formData.promoVideoProvider === "minio" && formData.promoVideoHlsUrl) {
      // If video is selected, show video cover if available, otherwise generic placeholder
      if (formData.promoVideoCoverFileId) {
        return (
          <img
            src={FileService.getCourseCoverUrl(formData.promoVideoCoverFileId)}
            alt="Video cover"
            className="absolute inset-0 h-full w-full object-cover"
          />
        );
      }
      return (
        <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-black/5 text-[rgb(var(--text-muted))]">
          <PlayCircle className="h-10 w-10 mb-2" />
          <span className="text-xs font-medium">Video Seleccionado</span>
        </div>
      );
    }
    if (formData.bannerFileId) {
      // Check if it's a pattern
      const pattern = getBannerById(formData.bannerFileId);
      if (pattern) {
        return (
          <img
            src={pattern.url}
            alt={pattern.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        );
      }

      // Otherwise assume it's a file ID
      return (
        <img
          src={FileService.getCourseCoverUrl(formData.bannerFileId)}
          alt="Banner"
          className="absolute inset-0 h-full w-full object-cover"
        />
      );
    }
    return null;
  };

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

    // Validate file size (max 8MB - increased for high res mobile photos)
    if (file.size > 8 * 1024 * 1024) {
      showToast(`${t("teacher.errors.uploadFailed")} (max 8MB)`, "error");
      return;
    }

    setUploading?.(true);
    try {
      // Delete old cover if exists
      if (formData.coverFileId) {
        try {
          await FileService.deleteCourseCover(formData.coverFileId);
        } catch (e) {
          console.warn("Failed to delete old cover:", e);
        }
      }

      const fileId = await FileService.uploadCourseCover(file);
      setFormData((prev) => ({ ...prev, coverFileId: fileId }));

      // Create local preview
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
    } catch (error) {
      console.error("Cover upload failed:", error);
      showToast(t("teacher.errors.uploadFailed"), "error");
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
        promoVideoCoverFileId: selection.coverId || "",
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

      // We do NOT delete the promo video file here, as per instructions
      // just clear the ID from the form so banner takes priority
      setFormData((prev) => ({
        ...prev,
        bannerFileId: selection.value,
        promoVideoProvider: "appwrite", // Reset provider
        promoVideoHlsUrl: "",
        promoVideoCoverFileId: "",
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
        <div
          className="relative flex aspect-video w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] text-center cursor-pointer hover:bg-[rgb(var(--bg-muted))/0.8] transition-colors overflow-hidden"
          onClick={() =>
            !uploading && document.getElementById("cover-upload").click()
          }
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Cover preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {t("teacher.form.uploadCover")}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveCover();
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="text-[rgb(var(--text-muted))]">
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <LoadingSpinner size="sm" />
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

        <div
          className="relative flex aspect-3/1 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] text-center cursor-pointer hover:bg-[rgb(var(--bg-muted))/0.8] transition-colors overflow-hidden"
          onClick={() => setBannerModalOpen(true)}
        >
          {formData.bannerFileId ||
          (formData.promoVideoProvider === "minio" &&
            formData.promoVideoHlsUrl) ? (
            <>
              {getBannerPreview()}
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4" />
                  Cambiar Banner/Trailer
                </span>
              </div>
            </>
          ) : (
            <div className="text-[rgb(var(--text-muted))] flex flex-col items-center">
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
    </Card>
  );
}
