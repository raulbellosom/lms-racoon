import { db, ID, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";
import { demoReviews } from "./seed_lms";

const hasAppwrite = () =>
  !!import.meta.env.VITE_APPWRITE_ENDPOINT && !!import.meta.env.VITE_APPWRITE_PROJECT_ID;

export async function listReviewsForCourse(courseId, { limit = 20 } = {}) {
  if (!hasAppwrite()) {
    return demoReviews.filter((r) => r.courseId === courseId).slice(0, limit);
  }
  const res = await db.listDocuments(APPWRITE.databaseId, APPWRITE.collections.reviews, [
    Query.equal("courseId", courseId),
    Query.orderDesc("createdAt"),
    Query.limit(limit),
  ]);
  return res.documents;
}

export async function createReview({ courseId, userId, rating, title = "", body = "" }) {
  if (!hasAppwrite()) {
    const doc = {
      $id: "demo_" + Math.random().toString(36).slice(2),
      courseId,
      userId,
      rating,
      title,
      body,
      createdAt: new Date().toISOString(),
      enabled: true,
    };
    demoReviews.unshift(doc);
    return doc;
  }
  return db.createDocument(APPWRITE.databaseId, APPWRITE.collections.reviews, ID.unique(), {
    courseId,
    userId,
    rating,
    title,
    body,
    createdAt: new Date().toISOString(),
    enabled: true,
  });
}
