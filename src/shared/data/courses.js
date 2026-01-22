import { db, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";
import { demoCourses } from "./demo";

export async function listPublishedCourses({ q = "", categoryId = "", limit = 24 } = {}) {
  if (!import.meta.env.VITE_APPWRITE_ENDPOINT || !import.meta.env.VITE_APPWRITE_PROJECT_ID) {
    const filtered = demoCourses.filter((c) => {
      const okQ = q ? (c.title + " " + c.subtitle).toLowerCase().includes(q.toLowerCase()) : true;
      const okCat = categoryId ? c.categoryId === categoryId : true;
      return okQ && okCat;
    });
    return filtered.slice(0, limit);
  }

  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.courses;

  const queries = [
    Query.equal("isPublished", true),
    Query.orderDesc("publishedAt"),
    Query.limit(limit),
  ];
  if (q) queries.push(Query.search("title", q));
  if (categoryId) queries.push(Query.equal("categoryId", categoryId));

  const res = await db.listDocuments(dbId, col, queries);
  return res.documents;
}

export async function getCourseById(courseId) {
  if (!import.meta.env.VITE_APPWRITE_ENDPOINT || !import.meta.env.VITE_APPWRITE_PROJECT_ID) {
    const course = demoCourses.find((c) => c.$id === courseId);
    if (!course) throw new Error("Curso no encontrado (demo).");
    return course;
  }
  const dbId = APPWRITE.databaseId;
  const col = APPWRITE.collections.courses;
  return db.getDocument(dbId, col, courseId);
}
