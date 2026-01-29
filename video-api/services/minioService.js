import * as Minio from "minio";

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "minio.racoondevs.com",
  port: parseInt(process.env.MINIO_PORT) || 443,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  pathStyle: true, // Force path-style for IP access (avoids bucket.ip issues)
  region: "us-east-1",
});

export const uploadFile = async (
  bucketName,
  objectName,
  filePath,
  contentType,
) => {
  // Ensure bucket exists (Try to create, ignore if exists)
  try {
    await minioClient.makeBucket(bucketName);
    console.log(`[MinIO] Created bucket '${bucketName}'`);
  } catch (err) {
    if (
      err.code === "BucketAlreadyOwnedByYou" ||
      err.code === "BucketAlreadyExists"
    ) {
      // Bucket exists, proceed
    } else {
      console.error(`[MinIO] Error ensuring bucket '${bucketName}':`, err);
      throw new Error(`MinIO bucket error: ${err.message}`);
    }
  }

  const metaData = {
    "Content-Type": contentType,
  };

  return minioClient.fPutObject(bucketName, objectName, filePath, metaData);
};
