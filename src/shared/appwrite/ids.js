const env = import.meta.env;

const pick = (key, fallback) => env[key] ?? fallback;

export const APPWRITE = {
  databaseId: pick("VITE_APPWRITE_DATABASE_ID", "lms"),
  collections: {
    profiles: pick("VITE_APPWRITE_COL_PROFILES", "profiles"),
    courses: pick("VITE_APPWRITE_COL_COURSES", "courses"),
    courseSections: pick("VITE_APPWRITE_COL_COURSE_SECTIONS", "courseSections"),
    lessons: pick("VITE_APPWRITE_COL_LESSONS", "lessons"),
    lessonTimestamps: pick(
      "VITE_APPWRITE_COL_LESSON_TIMESTAMPS",
      "lessonTimestamps",
    ),
    enrollments: pick("VITE_APPWRITE_COL_ENROLLMENTS", "enrollments"),
    lessonProgress: pick("VITE_APPWRITE_COL_LESSON_PROGRESS", "lessonProgress"),
    courseStats: pick("VITE_APPWRITE_COL_COURSE_STATS", "courseStats"),
    reviews: pick("VITE_APPWRITE_COL_REVIEWS", "reviews"),
    comments: pick("VITE_APPWRITE_COL_COMMENTS", "comments"),
    categories: pick("VITE_APPWRITE_COL_CATEGORIES", "categories"),
    assignments: pick("VITE_APPWRITE_COL_ASSIGNMENTS", "assignments"),
    submissions: pick("VITE_APPWRITE_COL_SUBMISSIONS", "submissions"),
    quizzes: pick("VITE_APPWRITE_COL_QUIZZES", "quizzes"),
    quizQuestions: pick("VITE_APPWRITE_COL_QUIZ_QUESTIONS", "quizQuestions"),
    quizAttempts: pick("VITE_APPWRITE_COL_QUIZ_ATTEMPTS", "quizAttempts"),
  },
  buckets: {
    avatars: pick("VITE_APPWRITE_BUCKET_AVATARS", "avatars"),
    courseCovers: pick("VITE_APPWRITE_BUCKET_COURSE_COVERS", "courseCovers"),
    lessonVideos: pick("VITE_APPWRITE_BUCKET_LESSON_VIDEOS", "lessonVideos"),
    lessonAttachments: pick(
      "VITE_APPWRITE_BUCKET_LESSON_ATTACHMENTS",
      "lessonAttachments",
    ),
    submissionAttachments: pick(
      "VITE_APPWRITE_BUCKET_SUBMISSION_ATTACHMENTS",
      "submissionAttachments",
    ),
  },
  functions: {
    onUserCreated: pick("VITE_APPWRITE_FN_ON_USER_CREATED", "onUserCreated"),
    syncUserProfile: pick(
      "VITE_APPWRITE_FN_SYNC_USER_PROFILE",
      "syncUserProfile",
    ),
    authHandler: pick("VITE_APPWRITE_FN_AUTH_HANDLER", "authHandler"),
    onReviewCreated: pick(
      "VITE_APPWRITE_FN_ON_REVIEW_CREATED",
      "onReviewCreated",
    ),
    onCourseCreated: pick(
      "VITE_APPWRITE_FN_ON_COURSE_CREATED",
      "onCourseCreated",
    ),
    onEnrollmentCreated: pick(
      "VITE_APPWRITE_FN_ON_ENROLLMENT_CREATED",
      "onEnrollmentCreated",
    ),
  },
};
