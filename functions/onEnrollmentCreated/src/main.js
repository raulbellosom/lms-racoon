const sdk = require("node-appwrite");

/**
 * Racoon LMS — onEnrollmentCreated
 * Trigger: databases.*.collections.enrollments.documents.*.create
 *
 * Increments studentsCount in courseStats when a student enrolls.
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
    error("No courseId in enrollment");
    return res.json({ success: false, message: "Missing courseId" }, 400);
  }

  try {
    // Get current stats
    let stats;
    try {
      stats = await db.getDocument(
        databaseId,
        courseStatsCollectionId,
        courseId,
      );
    } catch (e) {
      if (e.code === 404) {
        // Create initial stats if missing
        stats = await db.createDocument(
          databaseId,
          courseStatsCollectionId,
          courseId,
          {
            courseId,
            ratingAvg: 0,
            ratingCount: 0,
            studentsCount: 0,
            commentsCount: 0,
            enabled: true,
          },
        );
      } else {
        throw e;
      }
    }

    // Increment students count
    await db.updateDocument(databaseId, courseStatsCollectionId, courseId, {
      studentsCount: (stats.studentsCount || 0) + 1,
    });

    log(`courseStats/${courseId} studentsCount incremented`);
    return res.json({
      success: true,
      courseId,
      studentsCount: stats.studentsCount + 1,
    });
  } catch (err) {
    error("onEnrollmentCreated failed: " + err.message);
    return res.json({ success: false, message: err.message }, 500);
  }
};
