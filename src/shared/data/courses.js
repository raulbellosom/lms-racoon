import { db, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

export async function listPublishedCourses({
  q = "",
  categoryId = "",
  limit = 12,
  page = 1,
} = {}) {
  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.courses;
  const offset = (page - 1) * limit;

  const queries = [
    Query.equal("isPublished", true),
    Query.orderDesc("publishedAt"),
    Query.limit(limit),
    Query.offset(offset),
  ];

  if (q) queries.push(Query.search("title", q));
  if (categoryId) queries.push(Query.equal("categoryId", categoryId));

  const res = await db.listDocuments(dbId, col, queries);
  return {
    documents: res.documents,
    total: res.total,
  };
}

export async function getCourseById(courseId) {
  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.courses;
  return db.getDocument(dbId, col, courseId);
}
