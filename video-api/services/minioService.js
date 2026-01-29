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
  // Check if bucket exists
  let exists = false;
  try {
    exists = await minioClient.bucketExists(bucketName);
  } catch (err) {
    if (err.code === "NoSuchBucket" || err.code === "NotFound") {
      exists = false;
    } else {
      // Re-throw other errors (AccessDenied, ConnectionRefused, etc.)
      console.error(`[MinIO] Error checking bucket '${bucketName}':`, err);
      throw new Error(`MinIO connection failed: ${err.message}`);
    }
  }

  if (!exists) {
    console.log(`[MinIO] Creating bucket '${bucketName}'...`);
    await minioClient.makeBucket(bucketName, "us-east-1");
  }

  const metaData = {
    "Content-Type": contentType,
  };

  return minioClient.fPutObject(bucketName, objectName, filePath, metaData);
};
