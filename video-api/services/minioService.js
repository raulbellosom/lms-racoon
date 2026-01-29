import * as Minio from "minio";

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "minio.racoondevs.com",
  port: parseInt(process.env.MINIO_PORT) || 443,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  pathStyle: true, // Force path-style for IP access (avoids bucket.ip issues)
});

export const uploadFile = async (
  bucketName,
  objectName,
  filePath,
  contentType,
) => {
  // Ensure bucket exists
  const exists = await minioClient.bucketExists(bucketName).catch((err) => {
    console.warn(
      `[MinIO] Check bucket '${bucketName}' failed (will attempt create):`,
      err.message,
    );
    return false;
  });
  if (!exists) {
    console.log(`[MinIO] Creating bucket '${bucketName}'...`);
    await minioClient.makeBucket(bucketName, "us-east-1");
  }

  const metaData = {
    "Content-Type": contentType,
  };

  return minioClient.fPutObject(bucketName, objectName, filePath, metaData);
};
