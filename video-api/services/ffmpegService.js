import ffmpeg from "fluent-ffmpeg";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory (video-api/.env)
dotenv.config({ path: join(__dirname, "..", ".env") });

if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

export const generateHLS = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    let duration = 0;

    ffmpeg(inputPath)
      .outputOptions([
        "-profile:v baseline", // Baseline profile for compatibility
        "-level 3.0",
        "-start_number 0",
        "-hls_time 10", // 10 second segments
        "-hls_list_size 0", // Include all segments in the playlist
        "-f hls",
      ])
      .output(outputPath)
      .on("start", (commandLine) => {
        // console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on("codecData", (data) => {
        // Get duration string (HH:MM:SS.ms) and convert to seconds
        const durParams = data.duration.split(":");
        duration = +durParams[0] * 3600 + +durParams[1] * 60 + +durParams[2];
      })
      .on("end", () => {
        console.log("Transcoding finished successfully");
        resolve(duration);
      })
      .on("error", (err) => {
        console.error("An error occurred: " + err.message);
        reject(err);
      })
      .run();
  });
};
