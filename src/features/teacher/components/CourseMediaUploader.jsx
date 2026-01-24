import React from "react";
import { useTranslation } from "react-i18next";
import { Image as ImageIcon, X, Upload } from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { FileService } from "../../../shared/data/files";

/**
 * CourseMediaUploader - Cover image and promo video uploader
 * @param {Object} formData - Form state object
 * @param {Function} setFormData - State setter function
 * @param {boolean} uploading - Upload in progress state
 * @param {Function} setUploading - Set upload state
 */
export function CourseMediaUploader({
  formData,
  setFormData,
  uploading = false,
  setUploading,
}) {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = React.useState(null);

  // Generate preview URL if cover exists
  React.useEffect(() => {
    if (formData.coverFileId) {
      const url = FileService.getCourseCoverUrl(formData.coverFileId);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, [formData.coverFileId]);

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert(t("teacher.errors.uploadFailed"));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(`${t("teacher.errors.uploadFailed")} (max 5MB)`);
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
      alert(t("teacher.errors.uploadFailed"));
    } finally {
      setUploading?.(false);
    }
  };

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

  return (
    <Card className="p-4 sm:p-6">
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
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[rgb(var(--brand-primary))] border-t-transparent" />
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
    </Card>
  );
}
