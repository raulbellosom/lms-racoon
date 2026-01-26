/**
 * Quizzes Service for Students
 * Take quizzes, manage attempts
 */
import { db, ID, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";
import {
  QuizService as QuizServiceTeacher,
  QuizQuestionService,
} from "./quizzes-teacher"; // Reuse read logic

const hasAppwrite = () =>
  !!import.meta.env.VITE_APPWRITE_ENDPOINT &&
  !!import.meta.env.VITE_APPWRITE_PROJECT_ID;

// Re-export reading methods
export const listQuizzesByLesson = QuizServiceTeacher.listByLesson;
export const getQuizById = QuizServiceTeacher.getById;
export const listQuestionsByQuiz = QuizQuestionService.listByQuiz;

/**
 * Get quiz with questions (Sanitized for student if needed, but for now getting full)
 */
export async function getQuizForStudent(quizId) {
  const quiz = await getQuizById(quizId);
  if (!quiz) return null;

  // Fetch questions
  // TODO: Ideally we should use a Cloud Function to fetch questions WITHOUT answerKey.
  // For this implementation, we fetch them client-side. The client "knows" the answers.
  // This is a security limitation of client-side logic.
  const questions = await listQuestionsByQuiz(quizId);

  return {
    ...quiz,
    questions: questions.map((q) => ({
      ...QuizQuestionService.parse(q),
      // We could strip answerKey here if we trusted the client to grade itself solely on submit.
      // But we actually need answerKey to grade LOCALLY or send to server.
    })),
  };
}

/**
 * Start a new quiz attempt
 */
export async function startAttempt({ quizId, courseId, userId }) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");

  return db.createDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.quizAttempts,
    ID.unique(),
    {
      quizId,
      courseId,
      userId,
      startedAt: new Date().toISOString(),
      answersJson: "{}",
      score: 0,
      passed: false,
      enabled: true,
    },
  );
}

/**
 * Get latest attempt for a quiz
 */
export async function getLatestAttempt(quizId, userId) {
  if (!hasAppwrite()) return null;

  const res = await db.listDocuments(
    APPWRITE.databaseId,
    APPWRITE.collections.quizAttempts,
    [
      Query.equal("quizId", quizId),
      Query.equal("userId", userId),
      Query.orderDesc("startedAt"),
      Query.limit(1),
    ],
  );
  return res.documents[0] || null;
}

/**
 * Submit an attempt
 */
export async function submitAttempt(attemptId, { answers, score, passed }) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");

  return db.updateDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.quizAttempts,
    attemptId,
    {
      answersJson: JSON.stringify(answers),
      score,
      passed,
      submittedAt: new Date().toISOString(),
    },
  );
}

export const QuizStudentService = {
  getQuizForStudent,
  startAttempt,
  getLatestAttempt,
  submitAttempt,
  listQuizzesByLesson,
};
