import * as minioService from "../services/minioService.js";
import * as ffmpegService from "../services/ffmpegService.js";
import fs from "fs";
import path from "path";

export const uploadVideo = async (req, res) => {
  const { lessonId } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No video file provided" });
  }

  console.log(`[Video] Processing lesson ${lessonId}`);

  const hlsOutputDir =
    process.env.HLS_OUTPUT_DIR || "/opt/video-stack/hls-data";
  const lessonHlsDir = path.join(hlsOutputDir, "lessons", lessonId);

  try {
    // 0. Cleanup old files if they exist (when replacing video)
    if (fs.existsSync(lessonHlsDir)) {
      console.log(`[Video] Cleaning old HLS files for lesson ${lessonId}`);
      fs.rmSync(lessonHlsDir, { recursive: true, force: true });
    }

    // Also try to delete old source from MinIO (best effort)
    try {
      const objectsStream = minioService.listObjectsStream(
        "raw-videos",
        `lessons/${lessonId}/`,
      );
      for await (const obj of objectsStream) {
        await minioService.deleteObject("raw-videos", obj.name);
        console.log(`[Video] Deleted old MinIO object: ${obj.name}`);
      }
    } catch (cleanupError) {
      // Non-fatal, continue with upload
      console.warn("[Video] Cleanup warning:", cleanupError.message);
    }

    // 1. Upload source to MinIO
    const objectKey = `lessons/${lessonId}/source${path.extname(file.originalname)}`;
    await minioService.uploadFile(
      "raw-videos",
      objectKey,
      file.path,
      file.mimetype,
      file.size,
    );

    // 2. Transcode to HLS
    // Ensure HLS directory exists (recreate after cleanup)
    if (!fs.existsSync(lessonHlsDir)) {
      fs.mkdirSync(lessonHlsDir, { recursive: true });
    }

    const hlsOutputPath = path.join(lessonHlsDir, "index.m3u8");
    const durationSec = await ffmpegService.generateHLS(
      file.path,
      hlsOutputPath,
    );

    // 3. Cleanup local source file
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      // Ignore cleanup errors
    }

    // 4. Return response
    const hlsUrl = `${process.env.HLS_PUBLIC_URL || "https://videos.racoondevs.com"}/hls/lessons/${lessonId}/index.m3u8`;

    console.log(`[Video] Completed lesson ${lessonId}`);

    res.json({
      videoProvider: "minio",
      videoObjectKey: objectKey,
      videoHlsUrl: hlsUrl,
      durationSec: Math.round(durationSec),
    });
  } catch (error) {
    console.error(`[Video] Error processing ${lessonId}:`, error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete video files for a lesson (HLS + MinIO source)
 */
export const deleteVideo = async (req, res) => {
  const { lessonId } = req.params;

  try {
    const hlsOutputDir =
      process.env.HLS_OUTPUT_DIR || "/opt/video-stack/hls-data";
    const lessonHlsDir = path.join(hlsOutputDir, "lessons", lessonId);

    // 1. Delete HLS files
    if (fs.existsSync(lessonHlsDir)) {
      fs.rmSync(lessonHlsDir, { recursive: true, force: true });
      console.log(`[Video] Deleted HLS files for lesson ${lessonId}`);
    }

    // 2. Delete from MinIO
    const objectsStream = minioService.listObjectsStream(
      "raw-videos",
      `lessons/${lessonId}/`,
    );
    for await (const obj of objectsStream) {
      await minioService.deleteObject("raw-videos", obj.name);
      console.log(`[Video] Deleted MinIO object: ${obj.name}`);
    }

    res.json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    console.error(`[Video] Delete error for ${lessonId}:`, error.message);
    res.status(500).json({ error: error.message });
  }
};
