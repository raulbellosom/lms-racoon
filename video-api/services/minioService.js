import * as Minio from "minio";

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "minio.racoondevs.com",
  port: parseInt(process.env.MINIO_PORT) || 443,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

export const uploadFile = async (
  bucketName,
  objectName,
  filePath,
  contentType,
) => {
  // Ensure bucket exists
  const exists = await minioClient.bucketExists(bucketName).catch(() => false);
  if (!exists) {
    await minioClient.makeBucket(bucketName, "us-east-1"); // Region doesn't matter much for self-hosted
  }

  const metaData = {
    "Content-Type": contentType,
  };

  return minioClient.fPutObject(bucketName, objectName, filePath, metaData);
};
