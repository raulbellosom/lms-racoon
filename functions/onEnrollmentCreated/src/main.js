const sdk = require("node-appwrite");
const admin = require("firebase-admin");

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

    // --- NOTIFICATION LOGIC START ---

    // 1. Initialize Firebase Admin
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
      } else {
        log("Skipping notification: Missing FIREBASE_SERVICE_ACCOUNT_JSON");
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
        // 2. Fetch Course to get Teacher ID and Title
        const course = await db.getDocument(
          databaseId,
          coursesCollectionId,
          courseId,
        );
        const teacherId = course.teacherId;
        const studentName = data.studentName || "Un estudiante"; // Ensure enrollment payload has studentName or fetch student profile

        if (teacherId) {
          // 3. Create Notification Document in Appwrite
          const notificationTitle = "Nuevo estudiante inscrito";
          const notificationBody = `${studentName} se ha inscrito en tu curso: ${course.title}`;

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
                type: "enrollment",
                entityId: courseId,
                createdAt: new Date().toISOString(),
              },
            );
          } catch (e) {
            error("Failed to create notification doc: " + e.message);
          }

          // 4. Send Push Notification via Firebase
          const prefsList = await db.listDocuments(
            databaseId,
            userPrefsCollectionId,
            [sdk.Query.equal("userId", teacherId), sdk.Query.limit(1)],
          );

          if (prefsList.documents.length > 0) {
            const prefs = prefsList.documents[0];
            if (prefs.prefsJson) {
              const parsed = JSON.parse(prefs.prefsJson);
              const tokens = parsed.fcmTokens || []; // Array of tokens

              if (tokens.length > 0) {
                const message = {
                  notification: {
                    title: notificationTitle,
                    body: notificationBody,
                  },
                  data: {
                    url: `/app/teach/courses/${courseId}`, // Helper link
                    type: "enrollment",
                  },
                  tokens: tokens,
                };

                const response = await admin.messaging().sendMulticast(message);
                log(
                  `Notifications sent: ${response.successCount}, Failed: ${response.failureCount}`,
                );
                if (response.failureCount > 0) {
                  const failedTokens = [];
                  response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                      failedTokens.push(tokens[idx]);
                      error(
                        `FCM Error for token ${tokens[idx]}: ` + resp.error,
                      );
                    }
                  });
                  // Optional: Remove invalid tokens from user prefs here to clean up
                }
              } else {
                log("No FCM tokens found for teacher");
              }
            }
          } else {
            log("Teacher has no preferences doc");
          }
        }
      } catch (e) {
        error("Notification logic failed: " + e.message);
      }
    }
    // --- NOTIFICATION LOGIC END ---

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
