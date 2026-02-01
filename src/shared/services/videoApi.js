export const VideoApi = {
  /**
   * Upload video to self-hosted Video API
   * @param {string} lessonId
   * @param {File} file
   * @returns {Promise<{videoProvider: string, videoObjectKey: string, videoHlsUrl: string, durationSec: number}>}
   */
  async uploadVideo(lessonId, file, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("video", file);

      const baseUrl = import.meta.env.VITE_VIDEO_API_BASE_URL;
      if (!baseUrl) {
        reject(new Error("VITE_VIDEO_API_BASE_URL is not defined in .env"));
        return;
      }

      const xhr = new XMLHttpRequest();
      // CRITICAL: Disable timeout for large uploads (browser default allows it, but being explicit is safer)
      xhr.timeout = 0;

      xhr.open("POST", `${baseUrl}/api/lessons/${lessonId}/video`);

      // Ensure no Authorization header conflicts if needed, but usually strictly not setting Content-Type
      // lets browser set it with boundary.
      // xhr.setRequestHeader("Authorization", `Bearer ${token}`); // If auth is needed later

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error("Invalid JSON response"));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(
              new Error(
                errorData.error || `Upload failed with status ${xhr.status}`,
              ),
            );
          } catch (e) {
            reject(new Error(`Video upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () =>
        reject(
          new Error("Network error during upload (check connection/CORS)"),
        );
      xhr.ontimeout = () => reject(new Error("Upload timed out"));
      xhr.onabort = () => reject(new Error("Upload aborted by user"));

      xhr.send(formData);
    });
  },

  /**
   * Delete video for a lesson (cleanup HLS + MinIO files)
   * @param {string} lessonId - Lesson ID
   * @returns {Promise<{success: boolean}>}
   */
  async deleteVideo(lessonId) {
    const baseUrl = import.meta.env.VITE_VIDEO_API_BASE_URL;
    if (!baseUrl) {
      throw new Error("VITE_VIDEO_API_BASE_URL is not defined in .env");
    }

    const response = await fetch(`${baseUrl}/api/lessons/${lessonId}/video`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete video");
    }

    return await response.json();
  },
};
