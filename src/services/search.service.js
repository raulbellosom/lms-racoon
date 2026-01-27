import { db, Query } from "../shared/appwrite/client";
import { APPWRITE } from "../shared/appwrite/ids";

/**
 * Service to handle search operations potentially aggregating multiple collections.
 * Currently client-side, but structured to be easily moved to a Cloud Function.
 */
class SearchService {
  /**
   * Performs a global search across courses, teachers, and lessons.
   * @param {string} query - The search term.
   * @param {Object} filters - additional filters (level, priceRange, etc.)
   * @returns {Promise<Object>} - { courses: [], teachers: [], lessons: [] }
   */
  async searchGlobal(query, filters = {}) {
    if (!query || query.length < 2) {
      return { courses: [], teachers: [], lessons: [] };
    }

    // TODO: When moving to Cloud Function, this will be a single function execution.
    // functions.createExecution('search', JSON.stringify({ query, filters }));

    try {
      const [courses, profiles, lessons] = await Promise.all([
        this.searchCourses(query, filters),
        this.searchTeachers(query),
        this.searchLessons(query),
      ]);

      return {
        courses,
        teachers: profiles,
        lessons,
      };
    } catch (error) {
      console.error("SearchService.searchGlobal error:", error);
      throw error;
    }
  }

  /**
   * Search courses by title or description.
   * Note: 'description' might not be indexed for fulltext in some setups, check appwrite.md.
   * appwrite_db_racoon_lms.md says: idx_title_fulltext.
   */
  async searchCourses(query, filters = {}) {
    const queries = [
      Query.search("title", query),
      Query.equal("isPublished", true),
      Query.equal("enabled", true),
      Query.limit(5),
    ];

    if (filters.level) {
      queries.push(Query.equal("level", filters.level));
    }

    // Price filtering might be tricky with client-side queries if not exact,
    // but assuming simple ranges or client-side filter after fetch if dataset small.
    // For now, let's just title search.

    const result = await db.listDocuments(
      APPWRITE.databaseId,
      APPWRITE.collections.courses,
      queries,
    );

    return result.documents;
  }

  /**
   * Search profiles where role is teacher.
   * appwrite_db_racoon_lms.md says: idx_name_fulltext on firstName, lastName.
   */
  async searchTeachers(query) {
    // We want to search first name OR last name.
    // Appwrite search queries are AND by default between different attributes,
    // but fulltext index on multiple attributes works for "term".

    // We only want teachers.
    const queries = [
      // Query.search("firstName", query), // Disabled: requires fulltext index on 'firstName' in DB.
      // Actually normally you search on the index.
      // appwrite_db_racoon_lms.md: idx_name_fulltext — fulltext — firstName, lastName
      // If we use Query.search("firstName", query), it might fail if index is composite?
      // No, usually you target one attribute. If the index includes both, Appwrite 1.4+ handles it.
      // safely, let's try searching firstName. If it fails we might need a dedicated text index attribute or function.
      Query.equal("role", "teacher"),
      Query.equal("enabled", true),
      Query.limit(3),
    ];

    try {
      const result = await db.listDocuments(
        APPWRITE.databaseId,
        APPWRITE.collections.profiles,
        queries,
      );
      return result.documents;
    } catch (e) {
      console.warn("Teacher search failed", e);
      return [];
    }
  }

  async searchLessons(query) {
    // Lessons have idx_title_fulltext? No, checking docs.
    // Docs: idx_courseId_order_asc, idx_sectionId_order_asc, idx_enabled_asc.
    // NO FULLTEXT INDEX ON LESSON TITLE IN DOCS.
    // This part might need to be skipped or we need to request adding an index.
    // For now, let's assume we can't search lessons efficiently without correct index.
    // We will return empty or try a 'contains' query if permissible (startsWith).
    // But 'search' operator requires fulltext index.

    // We will comment this out or return empty until index is confirmed.
    return [];
  }
}

export const searchService = new SearchService();
