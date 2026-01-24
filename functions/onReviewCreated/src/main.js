const sdk = require("node-appwrite");

/**
 * Racoon LMS — onReviewCreated
 * Trigger: databases.*.collections.reviews.documents.*.create
 *
 * Recalculates ratingAvg and ratingCount in courseStats when a review is submitted.
 */

module.exports = async ({ req, res, log, error }) => {
  const client = new sdk.Client();
  const db = new sdk.Databases(client);

  const endpoint =
    process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT;
  const projectId =
    process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
  const apiKey =
    process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY;

  const databaseId = process.env.APPWRITE_DATABASE_ID || "lms";
  const courseStatsCollectionId =
    process.env.APPWRITE_COURSE_STATS_COLLECTION_ID || "courseStats";
  const reviewsCollectionId =
    process.env.APPWRITE_REVIEWS_COLLECTION_ID || "reviews";

  if (!endpoint || !projectId || !apiKey) {
    error("Missing APPWRITE env vars");
    return res.json({ success: false, message: "Server misconfigured" }, 500);
  }

  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  let data = {};
  try {
    const raw = req.body ?? req.payload ?? "{}";
    data = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    error("Invalid event payload");
    return res.json({ success: false, message: "Invalid payload" }, 400);
  }

  const courseId = data.courseId;
  if (!courseId) {
    error("No courseId in review");
    return res.json({ success: false, message: "Missing courseId" }, 400);
  }

  try {
    // Get all reviews for this course
    const reviewsResult = await db.listDocuments(
      databaseId,
      reviewsCollectionId,
      [
        sdk.Query.equal("courseId", courseId),
        sdk.Query.equal("enabled", true),
        sdk.Query.limit(1000),
      ],
    );

    const reviews = reviewsResult.documents;
    const ratingCount = reviews.length;
    const ratingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const ratingAvg =
      ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 100) / 100 : 0;

    // Update courseStats
    try {
      await db.updateDocument(databaseId, courseStatsCollectionId, courseId, {
        ratingAvg,
        ratingCount,
      });
    } catch (e) {
      if (e.code === 404) {
        // Create if missing
        await db.createDocument(databaseId, courseStatsCollectionId, courseId, {
          courseId,
          ratingAvg,
          ratingCount,
          studentsCount: 0,
          commentsCount: 0,
          enabled: true,
        });
      } else {
        throw e;
      }
    }

    log(
      `courseStats/${courseId} ratingAvg=${ratingAvg}, ratingCount=${ratingCount}`,
    );
    return res.json({ success: true, courseId, ratingAvg, ratingCount });
  } catch (err) {
    error("onReviewCreated failed: " + err.message);
    return res.json({ success: false, message: err.message }, 500);
  }
};
