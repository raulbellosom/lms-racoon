/**
 * Upload Constants
 * File size limits and allowed formats for uploads
 */

// File size limits
export const UPLOAD_LIMITS = {
  // Appwrite attachments (lesson files, etc.)
  APPWRITE_MAX_SIZE_MB: 30,
  APPWRITE_MAX_SIZE_BYTES: 30 * 1024 * 1024, // 30 MB

  // MinIO videos
  MINIO_VIDEO_MAX_SIZE_MB: 400,
  MINIO_VIDEO_MAX_SIZE_BYTES: 400 * 1024 * 1024, // 400 MB
};

// Allowed video MIME types for MinIO
export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
  "video/x-matroska", // .mkv
];

// Allowed video extensions
export const ALLOWED_VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "mkv"];

/**
 * Validate file size for Appwrite uploads
 * @param {File} file - The file to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateAppwriteFileSize(file) {
  if (file.size > UPLOAD_LIMITS.APPWRITE_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `El archivo excede el límite de ${UPLOAD_LIMITS.APPWRITE_MAX_SIZE_MB} MB`,
    };
  }
  return { valid: true };
}

/**
 * Validate video file for MinIO uploads (size + format)
 * @param {File} file - The video file to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMinioVideo(file) {
  // Check size
  if (file.size > UPLOAD_LIMITS.MINIO_VIDEO_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `El video excede el límite de ${UPLOAD_LIMITS.MINIO_VIDEO_MAX_SIZE_MB} MB`,
    };
  }

  // Check format
  if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.type)) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    // Fallback to extension check if MIME type is not recognized
    if (!ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Formato de video no permitido. Usa: ${ALLOWED_VIDEO_EXTENSIONS.join(", ")}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
