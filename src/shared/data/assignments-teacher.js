/**
 * Assignments Service for Teacher/Instructor
 * CRUD operations for assignments
 */
import { db, ID, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

const hasAppwrite = () =>
  !!import.meta.env.VITE_APPWRITE_ENDPOINT &&
  !!import.meta.env.VITE_APPWRITE_PROJECT_ID;

/**
 * List all assignments for a course
 */
export async function listAssignmentsByCourse(courseId, { limit = 50 } = {}) {
  if (!hasAppwrite()) return [];

  const res = await db.listDocuments(
    APPWRITE.databaseId,
    APPWRITE.collections.assignments,
    [
      Query.equal("courseId", courseId),
      Query.equal("enabled", true),
      Query.orderAsc("order"),
      Query.limit(limit),
    ],
  );
  return res.documents;
}

/**
 * Get a single assignment by ID
 */
export async function getAssignmentById(assignmentId) {
  if (!hasAppwrite()) return null;
  return db.getDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.assignments,
    assignmentId,
  );
}

/**
 * Create a new assignment
 */
export async function createAssignment({
  courseId,
  lessonId = "",
  title,
  description = "",
  dueAt = null,
  pointsMax = 10,
  order = 0,
}) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");

  return db.createDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.assignments,
    ID.unique(),
    {
      courseId,
      lessonId,
      title,
      description,
      dueAt,
      pointsMax,
      order,
      enabled: true,
    },
  );
}

/**
 * Update an existing assignment
 */
export async function updateAssignment(assignmentId, data) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");
  return db.updateDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.assignments,
    assignmentId,
    data,
  );
}

/**
 * Delete an assignment (soft delete)
 */
export async function deleteAssignment(assignmentId) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");
  return db.updateDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.assignments,
    assignmentId,
    {
      enabled: false,
    },
  );
}

/**
 * Reorder assignments in a course
 */
export async function reorderAssignments(assignments) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");

  const updates = assignments.map((a, index) =>
    db.updateDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.assignments,
      a.$id,
      {
        order: index,
      },
    ),
  );

  return Promise.all(updates);
}

export const AssignmentService = {
  listByCourse: listAssignmentsByCourse,
  getById: getAssignmentById,
  create: createAssignment,
  update: updateAssignment,
  delete: deleteAssignment,
  reorder: reorderAssignments,
};
