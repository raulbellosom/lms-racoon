/**
 * Quizzes & Quiz Questions Service for Teacher/Instructor
 * CRUD operations for quizzes and their questions
 */
import { db, ID, Query } from "../appwrite/client";
import { APPWRITE } from "../appwrite/ids";

const hasAppwrite = () =>
  !!import.meta.env.VITE_APPWRITE_ENDPOINT &&
  !!import.meta.env.VITE_APPWRITE_PROJECT_ID;

// ============ QUIZZES ============

/**
 * List all quizzes for a course
 */
export async function listQuizzesByCourse(courseId, { limit = 50 } = {}) {
  if (!hasAppwrite()) return [];

  const res = await db.listDocuments(
    APPWRITE.databaseId,
    APPWRITE.collections.quizzes,
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
 * List quizzes by lesson ID
 */
export async function listQuizzesByLesson(lessonId) {
  if (!hasAppwrite()) return [];

  const res = await db.listDocuments(
    APPWRITE.databaseId,
    APPWRITE.collections.quizzes,
    [Query.equal("lessonId", lessonId), Query.equal("enabled", true)],
  );
  return res.documents;
}

/**
 * Get a single quiz by ID
 */
export async function getQuizById(quizId) {
  if (!hasAppwrite()) return null;
  return db.getDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.quizzes,
    quizId,
  );
}

/**
 * Create a new quiz
 */
export async function createQuiz({
  courseId,
  lessonId = "",
  title,
  description = "",
  timeLimitSec = 0,
  attemptsAllowed = 0,
  passingScore = 0.7,
  order = 0,
}) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");

  return db.createDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.quizzes,
    ID.unique(),
    {
      courseId,
      lessonId,
      title,
      description,
      timeLimitSec,
      attemptsAllowed,
      passingScore,
      order,
      enabled: true,
    },
  );
}

/**
 * Update an existing quiz
 */
export async function updateQuiz(quizId, data) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");
  return db.updateDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.quizzes,
    quizId,
    data,
  );
}

/**
 * Delete a quiz (soft delete)
 */
export async function deleteQuiz(quizId) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");
  return db.updateDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.quizzes,
    quizId,
    {
      enabled: false,
    },
  );
}

// ============ QUIZ QUESTIONS ============

/**
 * List all questions for a quiz
 */
export async function listQuestionsByQuiz(quizId, { limit = 100 } = {}) {
  if (!hasAppwrite()) return [];

  const res = await db.listDocuments(
    APPWRITE.databaseId,
    APPWRITE.collections.quizQuestions,
    [
      Query.equal("quizId", quizId),
      Query.orderAsc("order"),
      Query.limit(limit),
    ],
  );
  return res.documents;
}

/**
 * Create a new quiz question
 */
export async function createQuizQuestion({
  quizId,
  courseId,
  prompt,
  kind, // "single", "multi", "trueFalse", "short"
  options = [], // Array of option strings
  answerKey = [], // Array of correct answer indices or strings
  points = 1,
  order = 0,
  imageId = null,
}) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");

  return db.createDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.quizQuestions,
    ID.unique(),
    {
      quizId,
      courseId,
      prompt,
      kind,
      optionsJson: JSON.stringify(options),
      answerKeyJson: JSON.stringify(answerKey),
      points,
      order,
      imageId,
      enabled: true,
    },
  );
}

/**
 * Update a quiz question
 */
export async function updateQuizQuestion(questionId, data) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");

  // Convert arrays to JSON strings if provided
  const updateData = { ...data };
  if (data.options) {
    updateData.optionsJson = JSON.stringify(data.options);
    delete updateData.options;
  }
  if (data.answerKey) {
    updateData.answerKeyJson = JSON.stringify(data.answerKey);
    delete updateData.answerKey;
  }

  return db.updateDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.quizQuestions,
    questionId,
    updateData,
  );
}

/**
 * Delete a quiz question (soft delete)
 */
export async function deleteQuizQuestion(questionId) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");
  return db.updateDocument(
    APPWRITE.databaseId,
    APPWRITE.collections.quizQuestions,
    questionId,
    {
      enabled: false,
    },
  );
}

/**
 * Reorder questions in a quiz
 */
export async function reorderQuizQuestions(questions) {
  if (!hasAppwrite()) throw new Error("Appwrite not configured");

  const updates = questions.map((q, index) =>
    db.updateDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.quizQuestions,
      q.$id,
      {
        order: index,
      },
    ),
  );

  return Promise.all(updates);
}

// ============ HELPER FUNCTIONS ============

/**
 * Parse question data (convert JSON strings to arrays)
 */
export function parseQuestionData(question) {
  return {
    ...question,
    options: JSON.parse(question.optionsJson || "[]"),
    answerKey: JSON.parse(question.answerKeyJson || "[]"),
    imageId: question.imageId, // Explicitly include if needed, though ...rest spreads it usually.
    // Wait, parseQuestionData takes `question` and returns a new object.
    // `...question` spreads all props including imageId.
    // So this edit is redundancy check.
    // However, explicit is good.
    // Actually, `...question` is fine.
    // But I'll confirm `...question` is used. Yes: return { ...question, ... }
    // So I don't strictly need to add this unless I want to be safe or if imageId is separate.
    // I won't make this edit to save tool calls if it's already covered.
    // But wait, the `question` object from Appwrite SDK contains all attributes.
    // So `imageId` is already there.
    // I will SKIP this edit.
  };
}

/**
 * Get full quiz with questions
 */
export async function getQuizWithQuestions(quizId) {
  const quiz = await getQuizById(quizId);
  if (!quiz) return null;

  const questions = await listQuestionsByQuiz(quizId);
  return {
    ...quiz,
    questions: questions.map(parseQuestionData),
  };
}

export const QuizService = {
  listByCourse: listQuizzesByCourse,
  listByLesson: listQuizzesByLesson,
  getById: getQuizById,
  create: createQuiz,
  update: updateQuiz,
  delete: deleteQuiz,
  getWithQuestions: getQuizWithQuestions,
};

export const QuizQuestionService = {
  listByQuiz: listQuestionsByQuiz,
  create: createQuizQuestion,
  update: updateQuizQuestion,
  delete: deleteQuizQuestion,
  reorder: reorderQuizQuestions,
  parse: parseQuestionData,
};
