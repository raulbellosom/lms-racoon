import { db, Query, ID } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

/**
 * enrollment document id recommendation:
 * `${userId}_${courseId}` (<= 36 chars? Appwrite allows custom id up to 36)
 * We'll generate with that when possible.
 */
export async function enrollInCourse({ userId, courseId, priceCents = 0, currency = "MXN" }) {
  if (!import.meta.env.VITE_APPWRITE_ENDPOINT || !import.meta.env.VITE_APPWRITE_PROJECT_ID) {
    localStorage.setItem(`demo-enroll:${userId}:${courseId}`, "1");
    return { $id: `${userId}_${courseId}`, userId, courseId, status: "active" };
  }

  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.enrollments;
  const docId = `${userId}_${courseId}`.slice(0, 36);

  return db.createDocument(dbId, col, docId, {
    userId,
    courseId,
    status: "active",
    priceCents,
    currency,
    enrolledAt: new Date().toISOString(),
  });
}

export async function listMyEnrollments({ userId, limit = 50 } = {}) {
  if (!import.meta.env.VITE_APPWRITE_ENDPOINT || !import.meta.env.VITE_APPWRITE_PROJECT_ID) {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(`demo-enroll:${userId}:`));
    return keys.map((k) => ({ courseId: k.split(":").pop(), status: "active" }));
  }

  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.enrollments;
  const res = await db.listDocuments(dbId, col, [Query.equal("userId", userId), Query.limit(limit)]);
  return res.documents;
}

export async function upsertLessonProgress({ userId, courseId, lessonId, watchedSec = 0, completed = false }) {
  if (!import.meta.env.VITE_APPWRITE_ENDPOINT || !import.meta.env.VITE_APPWRITE_PROJECT_ID) {
    const key = `demo-progress:${userId}:${courseId}:${lessonId}`;
    localStorage.setItem(key, JSON.stringify({ watchedSec, completed }));
    return { $id: key, userId, courseId, lessonId, watchedSec, completed };
  }

  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.lessonProgress;
  const docId = `${userId}_${lessonId}`.slice(0, 36);

  // try update first
  try {
    return await db.updateDocument(dbId, col, docId, {
      watchedSec,
      completed,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return db.createDocument(dbId, col, docId, {
      userId,
      courseId,
      lessonId,
      watchedSec,
      completed,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }
}
