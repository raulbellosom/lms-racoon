export const VideoApi = {
  /**
   * Upload video to self-hosted Video API
   * @param {string} lessonId
   * @param {File} file
   * @returns {Promise<{videoProvider: string, videoObjectKey: string, videoHlsUrl: string, durationSec: number}>}
   */
  async uploadVideo(lessonId, file) {
    const formData = new FormData();
    formData.append("file", file);

    const baseUrl = import.meta.env.VITE_VIDEO_API_BASE_URL;
    if (!baseUrl) {
      throw new Error("VITE_VIDEO_API_BASE_URL is not defined in .env");
    }

    const response = await fetch(`${baseUrl}/api/lessons/${lessonId}/video`, {
      method: "POST",
      body: formData,
      // No headers needed for FormData, browser sets boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Video upload failed");
    }

    return await response.json();
  },
};
