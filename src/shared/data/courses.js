import { db, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

export async function listPublishedCourses({
  q = "",
  categoryId = "",
  limit = 12,
  page = 1,
  teacherId = "",
  excludeTeacherId = "",
  levels = [],
  priceMin = null,
  priceMax = null,
  isFree = null,
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
  if (teacherId) queries.push(Query.equal("teacherId", teacherId));
  if (excludeTeacherId)
    queries.push(Query.notEqual("teacherId", excludeTeacherId));

  // New filters
  if (levels && levels.length > 0) {
    // Appwrite doesn't support "in" array check for scalar easily without multiple queries or array attribute
    // But "level" is a single enum. ANDing equal() won't work for multiple levels (e.g. beginner OR intermediate).
    // we would need Query.equal('level', [v1, v2]) which Appwrite supports now.
    queries.push(Query.equal("level", levels));
  }

  if (priceMin !== undefined && priceMin !== null) {
    queries.push(Query.greaterThanEqual("priceCents", parseInt(priceMin)));
  }

  if (priceMax !== undefined && priceMax !== null) {
    queries.push(Query.lessThanEqual("priceCents", parseInt(priceMax)));
  }

  // "isFree" is just priceCents == 0.
  // If isFree is true, we want only free courses.
  // If explicitly requested paid (isFree === false), we want > 0.
  if (isFree === true) {
    queries.push(Query.equal("priceCents", 0));
  } else if (isFree === false) {
    queries.push(Query.greaterThan("priceCents", 0));
  }

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
