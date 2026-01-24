const sdk = require("node-appwrite");

/**
 * Racoon LMS — onCourseCreated
 * Trigger: databases.*.collections.courses.documents.*.create
 *
 * Creates initial courseStats document for a new course.
 *
 * Requires API KEY (server) with permissions:
 * - databases.write
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
    error("Missing APPWRITE endpoint/projectId/apiKey env vars");
    return res.json({ success: false, message: "Server misconfigured" }, 500);
  }

  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  // Parse event data
  let data = {};
  try {
    const raw = req.body ?? req.payload ?? "{}";
    data = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    error("Invalid event payload: " + e.message);
    return res.json({ success: false, message: "Invalid payload" }, 400);
  }

  // Get the course ID from the event
  const courseId = data.$id;
  if (!courseId) {
    error("No courseId in event payload");
    return res.json({ success: false, message: "No courseId in payload" }, 400);
  }

  try {
    // Check if courseStats already exists
    try {
      await db.getDocument(databaseId, courseStatsCollectionId, courseId);
      log(`courseStats/${courseId} already exists`);
      return res.json({ success: true, action: "exists", courseId });
    } catch (e) {
      // Document doesn't exist, create it
      if (e.code !== 404) throw e;
    }

    // Create initial courseStats
    const stats = {
      courseId,
      ratingAvg: 0,
      ratingCount: 0,
      studentsCount: 0,
      commentsCount: 0,
      enabled: true,
    };

    await db.createDocument(
      databaseId,
      courseStatsCollectionId,
      courseId,
      stats,
    );
    log(`courseStats/${courseId} created`);
    return res.json({ success: true, action: "created", courseId });
  } catch (err) {
    error("onCourseCreated failed: " + err.message);
    return res.json(
      { success: false, message: err.message, code: err.code },
      500,
    );
  }
};
