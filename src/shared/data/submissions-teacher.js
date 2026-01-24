/**
 * Submissions Service for Teacher/Instructor
 * View and grade student submissions
 */
import { db, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

const hasAppwrite = () =>
  !!import.meta.env.VITE_APPWRITE_ENDPOINT &&
  !!import.meta.env.VITE_APPWRITE_PROJECT_ID;

/**
 * List all submissions for an assignment
 */
export async function listSubmissionsByAssignment(
  assignmentId,
  { limit = 100 } = {},
) {
  if (!hasAppwrite()) return [];

  const res = await db.listDocuments(
    APPWRITE.databaseId,
    APPWRITE.collections.submissions,
    [
      Query.equal("assignmentId", assignmentId),
      Query.equal("enabled", true),
      Query.orderDesc("submittedAt"),
      Query.limit(limit),
    ],
  );
  return res.documents;
}

/**
 * List all submissions for a course
 */
export async function listSubmissionsByCourse(
  courseId,
  { limit = 100, status = null } = {},
) {
  if (!hasAppwrite()) return [];

  const queries = [
    Query.equal("courseId", courseId),
    Query.equal("enabled", true),
    Query.orderDesc("submittedAt"),
    Query.limit(limit),
  ];

  if (status) {
    queries.push(Query.equal("status", status));
  }

  const res = await db.listDocuments(
    APPWRITE.databaseId,
    APPWRITE.collections.submissions,
    queries,
  );
  return res.documents;
}

/**
 * Get a single submission by ID
 */
export async function getSubmissionById(submissionId) {
  if (!hasAppwrite()) return null;
  return db.getDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.submissions,
    submissionId,
  );
}

/**
 * Grade a submission
 */
export async function gradeSubmission(
  submissionId,
  { pointsAwarded, teacherFeedback = "" },
) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");

  return db.updateDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.submissions,
    submissionId,
    {
      status: "reviewed",
      pointsAwarded,
      teacherFeedback,
      reviewedAt: new Date().toISOString(),
    },
  );
}

/**
 * Reject a submission (ask for resubmission)
 */
export async function rejectSubmission(submissionId, { teacherFeedback = "" }) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");

  return db.updateDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.submissions,
    submissionId,
    {
      status: "rejected",
      teacherFeedback,
      reviewedAt: new Date().toISOString(),
    },
  );
}

/**
 * Get submission stats for an assignment
 */
export async function getSubmissionStats(assignmentId) {
  if (!hasAppwrite()) return { total: 0, pending: 0, reviewed: 0, rejected: 0 };

  const submissions = await listSubmissionsByAssignment(assignmentId, {
    limit: 500,
  });

  return {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === "submitted").length,
    reviewed: submissions.filter((s) => s.status === "reviewed").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
    draft: submissions.filter((s) => s.status === "draft").length,
  };
}

export const SubmissionsService = {
  listByAssignment: listSubmissionsByAssignment,
  listByCourse: listSubmissionsByCourse,
  getById: getSubmissionById,
  grade: gradeSubmission,
  reject: rejectSubmission,
  getStats: getSubmissionStats,
};
