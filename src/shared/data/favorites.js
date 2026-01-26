import { db } from "../appwrite/client";
import { ID, Query } from "appwrite";
import { APPWRITE } from "../appwrite/ids";

export const FavoritesService = {
  /**
   * Add a course to favorites
   * @param {string} courseId
   * @param {string} userId
   */
  async addToFavorites(userId, courseId) {
    if (!userId || !courseId) throw new Error("Missing userId or courseId");

    // Check if already exists to avoid duplicates (though index should catch it)
    const existing = await this.isFavorite(userId, courseId);
    if (existing) return existing;

    return await db.createDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.favorites,
      ID.unique(),
      {
        userId,
        courseId,
        createdAt: new Date().toISOString(),
      },
    );
  },

  /**
   * Remove a course from favorites
   * @param {string} courseId
   * @param {string} userId
   */
  async removeFromFavorites(userId, courseId) {
    if (!userId || !courseId) throw new Error("Missing userId or courseId");

    // We need the document ID to delete
    const result = await db.listDocuments(
      APPWRITE.databaseId,
      APPWRITE.collections.favorites,
      [
        Query.equal("userId", userId),
        Query.equal("courseId", courseId),
        Query.limit(1),
      ],
    );

    if (result.documents.length > 0) {
      await db.deleteDocument(
        APPWRITE.databaseId,
        APPWRITE.collections.favorites,
        result.documents[0].$id,
      );
      return true;
    }
    return false;
  },

  /**
   * Check if a course is favorited by user
   * @param {string} userId
   * @param {string} courseId
   * @returns {Promise<boolean>}
   */
  async isFavorite(userId, courseId) {
    if (!userId || !courseId) return false;

    try {
      const result = await db.listDocuments(
        APPWRITE.databaseId,
        APPWRITE.collections.favorites,
        [
          Query.equal("userId", userId),
          Query.equal("courseId", courseId),
          Query.limit(1),
        ],
      );
      return result.documents.length > 0;
    } catch (e) {
      console.error("Failed to check favorite status", e);
      return false;
    }
  },

  /**
   * Get total favorites count for a course (public)
   * @param {string} courseId
   * @returns {Promise<number>}
   */
  async getCourseFavoritesCount(courseId) {
    try {
      const result = await db.listDocuments(
        APPWRITE.databaseId,
        APPWRITE.collections.favorites,
        [
          Query.equal("courseId", courseId),
          Query.limit(1), // We only care about the count
        ],
      );
      return result.total;
    } catch (e) {
      console.error("Failed to get favorites count", e);
      return 0;
    }
  },

  /**
   * List user's favorites
   * @param {string} userId
   * @returns {Promise<string[]>} Array of courseIds
   */
  async listByUser(userId) {
    if (!userId) return [];
    try {
      const result = await db.listDocuments(
        APPWRITE.databaseId,
        APPWRITE.collections.favorites,
        [
          Query.equal("userId", userId),
          Query.orderDesc("createdAt"),
          Query.limit(100),
        ],
      );
      // Return just the courseIds, frontend will fetch course details
      return result.documents.map((doc) => doc.courseId);
    } catch (e) {
      console.error("Failed to list user favorites", e);
      return [];
    }
  },
};
