const sdk = require("node-appwrite");
const admin = require("firebase-admin");

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

    // --- NOTIFICATION LOGIC START ---
    if (!admin.apps.length) {
      const serviceAccountParams = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountParams) {
        try {
          const serviceAccount = JSON.parse(serviceAccountParams);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        } catch (e) {
          error("Firebase init failed: " + e.message);
        }
      }
    }

    if (admin.apps.length) {
      const coursesCollectionId =
        process.env.APPWRITE_COURSES_COLLECTION_ID || "courses";
      const notificationsCollectionId =
        process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID || "notifications";
      const userPrefsCollectionId =
        process.env.APPWRITE_USER_PREFS_COLLECTION_ID || "userPreferences";

      try {
        const course = await db.getDocument(
          databaseId,
          coursesCollectionId,
          courseId,
        );
        const teacherId = course.teacherId;

        if (teacherId) {
          const notificationTitle = "Nueva reseña recibida";
          const notificationBody = `Tu curso "${course.title}" ha recibido una nueva calificación.`;

          // Create Notification
          try {
            await db.createDocument(
              databaseId,
              notificationsCollectionId,
              sdk.ID.unique(),
              {
                userId: teacherId,
                title: notificationTitle,
                body: notificationBody,
                read: false,
                type: "review",
                // entityId: courseId,
                dataJson: JSON.stringify({ entityId: courseId }),
              },
            );
          } catch (e) {
            error("Failed to create notification doc: " + e.message);
          }

          // Send Push
          const prefsList = await db.listDocuments(
            databaseId,
            userPrefsCollectionId,
            [sdk.Query.equal("userId", teacherId), sdk.Query.limit(1)],
          );

          if (prefsList.documents.length > 0) {
            const prefs = prefsList.documents[0];
            if (prefs.prefsJson) {
              const parsed = JSON.parse(prefs.prefsJson);
              const tokens = parsed.fcmTokens || [];

              if (tokens.length > 0) {
                const message = {
                  notification: {
                    title: notificationTitle,
                    body: notificationBody,
                  },
                  data: {
                    url: `/app/teach/courses/${courseId}`,
                    type: "review",
                  },
                  tokens: tokens, // Multicast
                };
                const response = await admin.messaging().sendMulticast(message);
                if (response.failureCount > 0) {
                  // Handle failures
                  error(`FCM Code: ${response.failureCount} failed.`);
                }
              }
            }
          }
        }
      } catch (e) {
        error("Notification logic failed: " + e.message);
      }
    }
    // --- NOTIFICATION LOGIC END ---

    return res.json({ success: true, courseId, ratingAvg, ratingCount });
  } catch (err) {
    error("onReviewCreated failed: " + err.message);
    return res.json({ success: false, message: err.message }, 500);
  }
};
