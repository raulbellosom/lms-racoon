import React from "react";

/**
 * Upload Status Types
 */
export const UPLOAD_STATUS = {
  PENDING: "pending",
  UPLOADING: "uploading",
  COMPLETE: "complete",
  ERROR: "error",
};

/**
 * Upload Progress Context
 * Centralized state management for file uploads across the app
 */
const UploadProgressContext = React.createContext(null);

export function useUploadProgress() {
  const context = React.useContext(UploadProgressContext);
  if (!context) {
    throw new Error(
      "useUploadProgress must be used within UploadProgressProvider",
    );
  }
  return context;
}

/**
 * Generate unique ID for uploads
 */
let uploadIdCounter = 0;
function generateUploadId() {
  return `upload_${Date.now()}_${++uploadIdCounter}`;
}

export function UploadProgressProvider({ children }) {
  const [uploads, setUploads] = React.useState([]);
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [errorModal, setErrorModal] = React.useState(null);

  /**
   * Add a new upload to track
   * @param {string} fileName - Name of the file being uploaded
   * @param {string} fileType - Type of file (video, attachment, cover)
   * @returns {string} Upload ID for tracking
   */
  const addUpload = React.useCallback((fileName, fileType = "file") => {
    const id = generateUploadId();
    const newUpload = {
      id,
      fileName,
      fileType,
      progress: 0,
      status: UPLOAD_STATUS.UPLOADING,
      error: null,
      startedAt: Date.now(),
    };

    setUploads((prev) => [...prev, newUpload]);
    setIsExpanded(true); // Auto-expand when new upload starts
    return id;
  }, []);

  /**
   * Update upload progress
   * @param {string} uploadId - The upload ID
   * @param {number} progress - Progress percentage (0-100)
   */
  const updateProgress = React.useCallback((uploadId, progress) => {
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === uploadId
          ? { ...upload, progress: Math.min(100, Math.max(0, progress)) }
          : upload,
      ),
    );
  }, []);

  /**
   * Mark upload as complete
   * @param {string} uploadId - The upload ID
   */
  const markComplete = React.useCallback((uploadId) => {
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === uploadId
          ? {
              ...upload,
              status: UPLOAD_STATUS.COMPLETE,
              progress: 100,
              completedAt: Date.now(),
            }
          : upload,
      ),
    );
  }, []);

  /**
   * Mark upload as error
   * @param {string} uploadId - The upload ID
   * @param {string} errorMessage - Error message
   */
  const markError = React.useCallback((uploadId, errorMessage) => {
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === uploadId
          ? {
              ...upload,
              status: UPLOAD_STATUS.ERROR,
              error: errorMessage,
              completedAt: Date.now(),
            }
          : upload,
      ),
    );
  }, []);

  /**
   * Remove an upload from the list
   * @param {string} uploadId - The upload ID
   */
  const removeUpload = React.useCallback((uploadId) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== uploadId));
  }, []);

  /**
   * Clear all completed/errored uploads
   */
  const clearCompleted = React.useCallback(() => {
    setUploads((prev) =>
      prev.filter((upload) => upload.status === UPLOAD_STATUS.UPLOADING),
    );
  }, []);

  /**
   * Show error details modal
   * @param {Object} upload - The upload object with error
   */
  const showErrorDetails = React.useCallback((upload) => {
    setErrorModal(upload);
  }, []);

  /**
   * Close error modal
   */
  const closeErrorModal = React.useCallback(() => {
    setErrorModal(null);
  }, []);

  // Count active uploads
  const activeCount = React.useMemo(
    () => uploads.filter((u) => u.status === UPLOAD_STATUS.UPLOADING).length,
    [uploads],
  );

  const value = {
    uploads,
    isExpanded,
    setIsExpanded,
    errorModal,
    addUpload,
    updateProgress,
    markComplete,
    markError,
    removeUpload,
    clearCompleted,
    showErrorDetails,
    closeErrorModal,
    activeCount,
  };

  return (
    <UploadProgressContext.Provider value={value}>
      {children}
    </UploadProgressContext.Provider>
  );
}
