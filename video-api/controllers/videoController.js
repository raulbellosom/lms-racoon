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

  console.log(`Processing video for lesson ${lessonId}: ${file.path}`);

  try {
    // 1. Upload source to MinIO
    const objectKey = `lessons/${lessonId}/source${path.extname(file.originalname)}`;
    console.log(`Uploading to MinIO: ${objectKey}`);
    await minioService.uploadFile(
      "raw-videos",
      objectKey,
      file.path,
      file.mimetype,
    );

    // 2. Transcode to HLS
    console.log("Starting HLS transcoding...");
    const hlsOutputDir =
      process.env.HLS_OUTPUT_DIR || "/opt/video-stack/hls-data";
    const lessonHlsDir = path.join(hlsOutputDir, "lessons", lessonId);

    // Ensure HLS directory exists
    if (!fs.existsSync(lessonHlsDir)) {
      fs.mkdirSync(lessonHlsDir, { recursive: true });
    }

    const hlsOutputPath = path.join(lessonHlsDir, "index.m3u8");
    const durationSec = await ffmpegService.generateHLS(
      file.path,
      hlsOutputPath,
    );

    // 3. Cleanup local source file?
    // Plan says "Guarda temporalmente el MP4... Sube... Ejecuta ffmpeg..."
    // Maybe keep it or delete it. Let's delete it to save space if needed,
    // but maybe safer to keep for a while?
    // For this MVP implementation, let's delete the upload temp file.
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      console.warn("Failed to delete temp file:", e);
    }

    // 4. Return response
    const hlsUrl = `${process.env.HLS_PUBLIC_URL || "https://videos.racoondevs.com"}/hls/lessons/${lessonId}/index.m3u8`;

    res.json({
      videoProvider: "minio",
      videoObjectKey: objectKey,
      videoHlsUrl: hlsUrl,
      durationSec: Math.round(durationSec),
    });
  } catch (error) {
    console.error("Video processing error:", error);
    res.status(500).json({ error: error.message });
  }
};
