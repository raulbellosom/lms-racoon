export const AccessControl = {
  /**
   * Check if user can access a specific lesson
   * @param {Object} lesson - Lesson object (must include isFreePreview)
   * @param {Object} enrollment - Enrollment object (can be null)
   * @param {Object} user - User object (can be null)
   * @returns {boolean}
   */
  canAccessLesson(lesson, enrollment, user) {
    if (!lesson) return false;

    // 1. Free Preview (Requires Auth usually, or Public?)
    // User requested "cortesias a los alumnos auth unicamente"
    if (lesson.isFreePreview && user) {
      return true;
    }

    // 2. Active Enrollment
    if (enrollment && enrollment.status === "active") {
      return true;
    }

    // 3. Admin/Teacher owner (handled by backend usually, but UI check)
    if (user && user.prefs?.role === "admin") {
      return true;
    }

    return false;
  },

  /**
   * Check if user has enrolled in course
   */
  hasActiveEnrollment(enrollment) {
    return enrollment && enrollment.status === "active";
  },
};
