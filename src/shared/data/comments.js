import { db, ID, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";
import { demoComments } from "./seed_lms";

const hasAppwrite = () =>
  !!import.meta.env.VITE_APPWRITE_ENDPOINT &&
  !!import.meta.env.VITE_APPWRITE_PROJECT_ID;

export async function listCommentsForCourse(courseId, { limit = 30 } = {}) {
  if (!hasAppwrite()) {
    return demoComments.filter((c) => c.courseId === courseId).slice(0, limit);
  }
  const res = await db.listDocuments(
    APPWRITE.databaseId,
    APPWRITE.collections.comments,
    [
      Query.equal("courseId", courseId),
      Query.orderDesc("createdAt"),
      Query.limit(limit),
    ],
  );
  return res.documents;
}

export async function createComment({
  courseId,
  lessonId = "",
  userId,
  body,
  parentId = "",
}) {
  if (!hasAppwrite()) {
    const doc = {
      $id: "demo_" + Math.random().toString(36).slice(2),
      courseId,
      lessonId,
      userId,
      body,
      parentId,
      createdAt: new Date().toISOString(),
      enabled: true,
    };
    demoComments.unshift(doc);
    return doc;
  }
  return db.createDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.comments,
    ID.unique(),
    {
      courseId,
      lessonId,
      userId,
      body,
      parentId,
      parentId,
      enabled: true,
    },
  );
}
