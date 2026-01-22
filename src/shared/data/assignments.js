import { db, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";
import { demoAssignments } from "./seed_lms";

const hasAppwrite = () =>
  !!import.meta.env.VITE_APPWRITE_ENDPOINT && !!import.meta.env.VITE_APPWRITE_PROJECT_ID;

export async function listAssignmentsForCourse(courseId, { limit = 50 } = {}) {
  if (!hasAppwrite()) return demoAssignments.filter((a) => a.courseId === courseId).slice(0, limit);

  const res = await db.listDocuments(APPWRITE.databaseId, APPWRITE.collections.assignments, [
    Query.equal("courseId", courseId),
    Query.orderAsc("order"),
    Query.limit(limit),
  ]);
  return res.documents;
}
