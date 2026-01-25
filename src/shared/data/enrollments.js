import { db, Query, ID } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

/**
 * enrollment document id recommendation:
 * `${userId}_${courseId}` (<= 36 chars? Appwrite allows custom id up to 36)
 * We'll generate with that when possible.
 */
export async function enrollInCourse({
  userId,
  courseId,
  priceCents = 0,
  currency = "MXN",
}) {
  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.enrollments;
  const docId = `${userId}_${courseId}`.slice(0, 36);

  return db.createDocument(dbId, col, docId, {
    userId,
    courseId,
    status: "active",
    priceCents,
    currency,
  });
}

export async function listMyEnrollments({ userId, limit = 50 } = {}) {
  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.enrollments;
  const res = await db.listDocuments(dbId, col, [
    Query.equal("userId", userId),
    Query.limit(limit),
  ]);
  return res.documents;
}

export async function upsertLessonProgress({
  userId,
  courseId,
  lessonId,
  watchedSec = 0,
  completed = false,
}) {
  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.lessonProgress;
  const docId = `${userId}_${lessonId}`.slice(0, 36);

  // try update first
  try {
    return await db.updateDocument(dbId, col, docId, {
      watchedSec,
      completed,
    });
  } catch {
    return db.createDocument(dbId, col, docId, {
      userId,
      courseId,
      lessonId,
      watchedSec,
      completed,
    });
  }
}
