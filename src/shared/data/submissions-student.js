/**
 * Submissions Service for Students
 * Submit assignments
 */
import { db, ID, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

const hasAppwrite = () =>
  !!import.meta.env.VITE_APPWRITE_ENDPOINT &&
  !!import.meta.env.VITE_APPWRITE_PROJECT_ID;

/**
 * Get my submission for an assignment
 */
export async function getMySubmission(assignmentId, userId) {
  if (!hasAppwrite()) return null;

  const res = await db.listDocuments(
    APPWRITE.databaseId,
    APPWRITE.collections.submissions,
    [
      Query.equal("assignmentId", assignmentId),
      Query.equal("userId", userId),
      Query.orderDesc("submittedAt"),
      Query.limit(1),
    ],
  );
  return res.documents[0] || null;
}

/**
 * Create or Update Submission
 * If a draft exists, update it. If not, create new.
 * Or typically, one submission per assignment?
 * The schema has `uniq_assignment_user`. So valid only one.
 */
export async function saveSubmission({
  submissionId, // Optional, if updating
  assignmentId,
  courseId,
  userId,
  body = "",
  attachments = [], // strings
  status = "draft",
}) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");

  // Check existing if no ID provided
  if (!submissionId) {
    const existing = await getMySubmission(assignmentId, userId);
    if (existing) submissionId = existing.$id;
  }

  const payload = {
    body,
    attachments,
    status,
    submittedAt: status === "submitted" ? new Date().toISOString() : null,
  };

  if (submissionId) {
    return db.updateDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.submissions,
      submissionId,
      payload,
    );
  } else {
    return db.createDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.submissions,
      ID.unique(),
      {
        assignmentId,
        courseId,
        userId,
        ...payload,
        enabled: true,
        pointsAwarded: 0, // Reset
      },
    );
  }
}

export const StudentSubmissionService = {
  getMySubmission,
  saveSubmission,
};
