/**
 * File Upload Service
 * Handles file uploads to Appwrite Storage buckets
 */
import { storage, ID } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

const hasAppwrite = () =>
  !!import.meta.env.VITE_APPWRITE_ENDPOINT &&
  !!import.meta.env.VITE_APPWRITE_PROJECT_ID;

/**
 * Upload a file to a specific bucket
 * @param {string} bucketId - The bucket ID
 * @param {File} file - The file to upload
 * @param {string} [fileId] - Optional custom file ID
 * @returns {Promise<Object>} The uploaded file document
 */
export async function uploadFile(bucketId, file, fileId = null) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");

  const id = fileId || ID.unique();
  return storage.createFile(bucketId, id, file);
}

/**
 * Delete a file from a bucket
 * @param {string} bucketId - The bucket ID
 * @param {string} fileId - The file ID to delete
 */
export async function deleteFile(bucketId, fileId) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");
  return storage.deleteFile(bucketId, fileId);
}

/**
 * Get file preview URL (for images)
 * @param {string} bucketId - The bucket ID
 * @param {string} fileId - The file ID
 * @param {Object} options - Preview options (width, height, quality)
 */
export function getFilePreviewUrl(bucketId, fileId, options = {}) {
  if (!hasAppwrite() || !fileId) return null;

  const { width = 800, height, quality = 80 } = options;
  return storage.getFilePreview(
    bucketId,
    fileId,
    width,
    height,
    undefined,
    quality,
  );
}

/**
 * Get file view URL (for direct access)
 * @param {string} bucketId - The bucket ID
 * @param {string} fileId - The file ID
 */
export function getFileViewUrl(bucketId, fileId) {
  if (!hasAppwrite() || !fileId) return null;
  return storage.getFileView(bucketId, fileId);
}

/**
 * Get file download URL
 * @param {string} bucketId - The bucket ID
 * @param {string} fileId - The file ID
 */
export function getFileDownloadUrl(bucketId, fileId) {
  if (!hasAppwrite() || !fileId) return null;
  return storage.getFileDownload(bucketId, fileId);
}

/**
 * Get file metadata
 * @param {string} bucketId - The bucket ID
 * @param {string} fileId - The file ID
 */
export async function getFileMetadata(bucketId, fileId) {
  if (!hasAppwrite()) return null;
  return storage.getFile(bucketId, fileId);
}

// ============ SPECIALIZED UPLOAD FUNCTIONS ============

/**
 * Upload course cover image
 * @param {File} file - Image file
 * @returns {Promise<string>} The file ID
 */
export async function uploadCourseCover(file) {
  const result = await uploadFile(APPWRITE.buckets.courseCovers, file);
  return result.$id;
}

/**
 * Get course cover URL
 * @param {string} fileId - The file ID
 * @param {Object} options - Preview options
 */
export function getCourseCoverUrl(
  fileId,
  options = { width: 1280, height: 720 },
) {
  return getFilePreviewUrl(APPWRITE.buckets.courseCovers, fileId, options);
}

/**
 * Delete course cover
 * @param {string} fileId - The file ID
 */
export async function deleteCourseCover(fileId) {
  return deleteFile(APPWRITE.buckets.courseCovers, fileId);
}

/**
 * Upload lesson video
 * @param {File} file - Video file
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<string>} The file ID
 */
export async function uploadLessonVideo(file, onProgress = null) {
  // Note: Appwrite SDK doesn't support progress in browser,
  // but we include the signature for future compatibility
  const result = await uploadFile(APPWRITE.buckets.lessonVideos, file);
  return result.$id;
}

/**
 * Get lesson video URL
 * @param {string} fileId - The file ID
 */
export function getLessonVideoUrl(fileId) {
  return getFileViewUrl(APPWRITE.buckets.lessonVideos, fileId);
}

/**
 * Delete lesson video
 * @param {string} fileId - The file ID
 */
export async function deleteLessonVideo(fileId) {
  return deleteFile(APPWRITE.buckets.lessonVideos, fileId);
}

/**
 * Upload lesson attachment (PDF, ZIP, etc.)
 * @param {File} file - Attachment file
 * @returns {Promise<Object>} The file info with id and name
 */
export async function uploadLessonAttachment(file) {
  const result = await uploadFile(APPWRITE.buckets.lessonAttachments, file);
  return {
    id: result.$id,
    name: file.name,
    size: file.size,
    mimeType: file.type,
  };
}

/**
 * Get lesson attachment download URL
 * @param {string} fileId - The file ID
 */
export function getLessonAttachmentUrl(fileId) {
  return getFileDownloadUrl(APPWRITE.buckets.lessonAttachments, fileId);
}

/**
 * Delete lesson attachment
 * @param {string} fileId - The file ID
 */
export async function deleteLessonAttachment(fileId) {
  return deleteFile(APPWRITE.buckets.lessonAttachments, fileId);
}

/**
 * Get lesson attachment preview URL (for images)
 * @param {string} fileId - The file ID
 */
export function getLessonAttachmentPreviewUrl(fileId) {
  return getFilePreviewUrl(APPWRITE.buckets.lessonAttachments, fileId);
}

/**
 * Upload submission attachment (student assignment files)
 * @param {File} file - Attachment file
 * @returns {Promise<Object>} The file info with id and name
 */
export async function uploadSubmissionAttachment(file) {
  const result = await uploadFile(APPWRITE.buckets.submissionAttachments, file);
  return {
    id: result.$id,
    name: file.name,
    size: file.size,
    mimeType: file.type,
  };
}

/**
 * Get submission attachment download URL
 * @param {string} fileId - The file ID
 */
export function getSubmissionAttachmentUrl(fileId) {
  return getFileDownloadUrl(APPWRITE.buckets.submissionAttachments, fileId);
}

export const FileService = {
  upload: uploadFile,
  delete: deleteFile,
  getPreviewUrl: getFilePreviewUrl,
  getViewUrl: getFileViewUrl,
  getDownloadUrl: getFileDownloadUrl,
  getMetadata: getFileMetadata,

  // Course covers
  uploadCourseCover,
  getCourseCoverUrl,
  deleteCourseCover,

  // Lesson videos
  uploadLessonVideo,
  getLessonVideoUrl,
  deleteLessonVideo,

  // Lesson attachments
  uploadLessonAttachment,
  getLessonAttachmentUrl,
  getLessonAttachmentPreviewUrl,
  deleteLessonAttachment,

  /**
   * Get lesson attachment metadata (name, size, etc.)
   * @param {string} fileId - The file ID
   */
  async getLessonAttachmentMetadata(fileId) {
    if (!hasAppwrite()) return null;
    return storage.getFile(APPWRITE.buckets.lessonAttachments, fileId);
  },

  // Submission attachments
  uploadSubmissionAttachment,
  getSubmissionAttachmentUrl,
};
