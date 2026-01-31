import * as Minio from "minio";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory (video-api/.env)
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * MinIO Client Configuration
 * - Uses PATH-STYLE access (required for IP-based endpoints)
 * - Connects to internal MinIO server (127.0.0.1:9000)
 * - Does NOT create buckets dynamically (buckets must exist)
 */
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: Number(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  pathStyle: true, // Required for internal IP access (avoids virtual-host issues)
});

/**
 * Upload a file directly to MinIO
 * ASSUMES the bucket already exists (no dynamic bucket creation)
 * @param {string} bucketName - Target bucket (must exist)
 * @param {string} objectName - Object key/path within bucket
 * @param {string} filePath - Local file path to upload
 * @param {string} contentType - MIME type of the file
 * @returns {Promise} Upload result
 */
export const uploadFile = async (
  bucketName,
  objectName,
  filePath,
  contentType,
) => {
  console.log(
    `[MinIO] Uploading file to bucket '${bucketName}' as '${objectName}'`,
  );

  const metaData = {
    "Content-Type": contentType,
  };

  // Direct upload - bucket must already exist
  const result = await minioClient.fPutObject(
    bucketName,
    objectName,
    filePath,
    metaData,
  );

  console.log(`[MinIO] Upload successful: ${objectName}`);
  return result;
};
