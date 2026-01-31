import React from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  ChevronUp,
  ChevronDown,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Video,
  Image,
  File,
} from "lucide-react";
import {
  useUploadProgress,
  UPLOAD_STATUS,
} from "../../app/providers/UploadProgressContext";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { formatFileSize } from "../constants/uploadConstants";

/**
 * Get icon for file type
 */
function getFileIcon(fileType) {
  switch (fileType) {
    case "video":
      return Video;
    case "cover":
    case "image":
      return Image;
    default:
      return File;
  }
}

/**
 * Upload Progress Card
 * Floating card in bottom-right corner showing upload progress
 */
export function UploadProgressCard() {
  const { t } = useTranslation();
  const {
    uploads,
    isExpanded,
    setIsExpanded,
    errorModal,
    removeUpload,
    clearCompleted,
    showErrorDetails,
    closeErrorModal,
    activeCount,
  } = useUploadProgress();

  // Don't render if no uploads
  if (uploads.length === 0) return null;

  const hasCompleted = uploads.some(
    (u) =>
      u.status === UPLOAD_STATUS.COMPLETE || u.status === UPLOAD_STATUS.ERROR,
  );

  return (
    <>
      {/* Floating Card */}
      <div
        className="fixed bottom-4 right-4 z-[9999] w-80 max-w-[calc(100vw-2rem)] 
                   bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]
                   rounded-xl shadow-2xl overflow-hidden
                   animate-slide-up"
        style={{
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 
                     bg-linear-to-r from-[rgb(var(--brand-primary))] to-gray-900
                     cursor-pointer select-none text-white"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="font-semibold text-sm">
              {t("upload.title", "Subidas")} ({uploads.length})
            </span>
            {activeCount > 0 && (
              <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin" />
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasCompleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearCompleted();
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white/80 hover:text-white"
                title={t("upload.clearCompleted", "Limpiar completados")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button className="p-1 hover:bg-white/20 rounded transition-colors text-white">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Upload List */}
        <div
          className={`transition-all duration-300 ease-out overflow-hidden
                     ${isExpanded ? "max-h-80" : "max-h-0"}`}
        >
          <div className="max-h-80 overflow-y-auto divide-y divide-[rgb(var(--border-base))]">
            {uploads.map((upload) => (
              <UploadItem
                key={upload.id}
                upload={upload}
                onRemove={() => removeUpload(upload.id)}
                onShowError={() => showErrorDetails(upload)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Error Details Modal */}
      {errorModal && (
        <Modal
          open={!!errorModal}
          onClose={closeErrorModal}
          title={t("upload.errorTitle", "Error de Subida")}
          className="max-w-md!"
          footer={
            <Button onClick={closeErrorModal}>
              {t("common.close", "Cerrar")}
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">
                  {errorModal.fileName}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {errorModal.error}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CSS Keyframes */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progressPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </>
  );
}

/**
 * Individual Upload Item
 */
function UploadItem({ upload, onRemove, onShowError }) {
  const FileIcon = getFileIcon(upload.fileType);
  const isUploading = upload.status === UPLOAD_STATUS.UPLOADING;
  const isComplete = upload.status === UPLOAD_STATUS.COMPLETE;
  const isError = upload.status === UPLOAD_STATUS.ERROR;

  return (
    <div
      className={`p-3 transition-colors ${isError ? "cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10" : ""}`}
      onClick={isError ? onShowError : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                     ${isComplete ? "bg-green-100 dark:bg-green-900/30 text-green-600" : ""}
                     ${isError ? "bg-red-100 dark:bg-red-900/30 text-red-500" : ""}
                     ${isUploading ? "bg-blue-100 dark:bg-blue-900/30 text-blue-500" : ""}`}
        >
          {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isComplete && <Check className="h-4 w-4" />}
          {isError && <AlertCircle className="h-4 w-4" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
              {upload.fileName}
            </span>
            {!isUploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="shrink-0 p-1 hover:bg-[rgb(var(--bg-muted))] rounded transition-colors"
              >
                <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-[rgb(var(--text-muted))] mb-1">
                <span>{Math.round(upload.progress)}%</span>
              </div>
              <div className="h-1.5 bg-[rgb(var(--bg-muted))] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${upload.progress}%`,
                    background:
                      "linear-gradient(90deg, rgb(var(--brand-primary)), rgb(var(--brand-primary))/0.7, rgb(var(--brand-primary)))",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s linear infinite",
                  }}
                />
              </div>
            </div>
          )}

          {/* Status Text */}
          {isComplete && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Completado
            </p>
          )}
          {isError && (
            <p className="text-xs text-red-500 mt-1 truncate">
              {upload.error || "Error desconocido"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
